-- Review quiz RPC: only on units 3/6/9/12; sample that 3-unit block; strip answer keys.
-- Run after schema.sql + seed.sql

create or replace function public._review_unit_numbers(p_unit int)
returns int[]
language sql
immutable
as $$
  select case
    when p_unit > 0 and p_unit % 3 = 0 then array[p_unit - 2, p_unit - 1, p_unit]
    else array[]::int[]
  end;
$$;

create or replace function public._build_review_quiz_items(p_lesson_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_lesson public.lessons%rowtype;
  v_units int[];
  v_lesson_row record;
  v_item jsonb;
  v_pool jsonb := '[]'::jsonb;
  v_by_unit jsonb := '{}'::jsonb;
  v_unit int;
  v_arr jsonb;
  v_picked jsonb := '[]'::jsonb;
  v_target int := 11;
  v_guard int := 0;
  v_prefer_mcq boolean;
  v_idx int;
  v_take jsonb;
  v_units_sorted int[];
  v_u int;
  v_added boolean;
begin
  select * into v_lesson from public.lessons where id = p_lesson_id;
  if not found then
    raise exception 'Lesson not found';
  end if;

  if not (public.is_manager() or public.teacher_has_course(v_lesson.course_id)) then
    raise exception 'Access denied';
  end if;

  v_units := public._review_unit_numbers(v_lesson.unit_number);
  if v_units is null or coalesce(cardinality(v_units), 0) = 0 then
    raise exception 'Review quiz is only available on units 3, 6, 9, and 12';
  end if;

  for v_lesson_row in
    select *
    from public.lessons l
    where l.course_id = v_lesson.course_id
      and l.unit_number = any (v_units)
    order by l.unit_number
  loop
    if v_lesson_row.quiz_bank is null then
      continue;
    end if;
    for v_item in select * from jsonb_array_elements(v_lesson_row.quiz_bank)
    loop
      v_pool := v_pool || jsonb_build_array(
        v_item || jsonb_build_object(
          'sourceUnit', v_lesson_row.unit_number,
          'sourceTheme', v_lesson_row.theme,
          'sourceGrammar', v_lesson_row.grammar,
          'lessonId', v_lesson_row.id,
          'compositeId', v_lesson_row.id::text || ':' || coalesce(v_item->>'id', '')
        )
      );
    end loop;
  end loop;

  -- Group by unit (preserve order within unit)
  for v_item in select * from jsonb_array_elements(v_pool)
  loop
    v_unit := (v_item->>'sourceUnit')::int;
    v_arr := coalesce(v_by_unit->v_unit::text, '[]'::jsonb);
    v_by_unit := jsonb_set(v_by_unit, array[v_unit::text], v_arr || jsonb_build_array(v_item));
  end loop;

  select coalesce(array_agg(k::int order by k::int), array[]::int[])
  into v_units_sorted
  from jsonb_object_keys(v_by_unit) as k;

  while jsonb_array_length(v_picked) < v_target and v_guard < v_target * 20 loop
    v_guard := v_guard + 1;
    v_added := false;
    v_prefer_mcq := (jsonb_array_length(v_picked) % 2 = 0);

    foreach v_u in array v_units_sorted loop
      v_arr := v_by_unit->v_u::text;
      if v_arr is null or jsonb_array_length(v_arr) = 0 then
        continue;
      end if;

      v_idx := null;
      for i in 0 .. jsonb_array_length(v_arr) - 1 loop
        if v_prefer_mcq and (v_arr->i->>'type') = 'mcq' then
          v_idx := i;
          exit;
        elsif (not v_prefer_mcq) and (v_arr->i->>'type') = 'fill' then
          v_idx := i;
          exit;
        end if;
      end loop;
      if v_idx is null then
        v_idx := 0;
      end if;

      v_take := v_arr->v_idx;
      v_picked := v_picked || jsonb_build_array(v_take);

      -- remove taken element
      select coalesce(jsonb_agg(elem order by ord), '[]'::jsonb)
      into v_arr
      from jsonb_array_elements(v_by_unit->v_u::text) with ordinality as t(elem, ord)
      where (ord - 1) <> v_idx;

      v_by_unit := jsonb_set(v_by_unit, array[v_u::text], coalesce(v_arr, '[]'::jsonb));
      v_added := true;

      exit when jsonb_array_length(v_picked) >= v_target;
    end loop;

    exit when not v_added;
  end loop;

  return jsonb_build_object(
    'lessonId', v_lesson.id,
    'courseId', v_lesson.course_id,
    'unitNumber', v_lesson.unit_number,
    'units', to_jsonb(v_units),
    'lessonsMeta', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'unit_number', l.unit_number,
          'theme', l.theme,
          'grammar', l.grammar
        ) order by l.unit_number
      ), '[]'::jsonb)
      from public.lessons l
      where l.course_id = v_lesson.course_id
        and l.unit_number = any (v_units)
    ),
    'items', v_picked
  );
end;
$$;

create or replace function public.get_review_quiz(p_lesson_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_safe_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_safe jsonb;
begin
  v_payload := public._build_review_quiz_items(p_lesson_id);

  for v_item in select * from jsonb_array_elements(v_payload->'items')
  loop
    v_safe := v_item - 'answer' - 'correct' - 'a';
    v_safe_items := v_safe_items || jsonb_build_array(v_safe);
  end loop;

  return jsonb_set(v_payload, '{items}', v_safe_items);
end;
$$;

-- Teacher check-mode scoring without shipping the full key bank up front.
create or replace function public.grade_review_quiz(p_lesson_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_full jsonb;
  v_item jsonb;
  v_key text;
  v_student jsonb;
  v_ok boolean;
  v_correct int := 0;
  v_total int := 0;
  v_results jsonb := '[]'::jsonb;
  v_expected text;
begin
  v_full := public._build_review_quiz_items(p_lesson_id);

  for v_item in select * from jsonb_array_elements(v_full->'items')
  loop
    v_key := v_item->>'compositeId';
    v_student := p_answers -> v_key;

    if (v_item->>'type') = 'mcq' and v_item ? 'correct' then
      v_total := v_total + 1;
      v_ok := (v_student is not null) and ((v_student #>> '{}')::int = (v_item->>'correct')::int);
      if v_ok then v_correct := v_correct + 1; end if;
      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'compositeId', v_key,
        'ok', v_ok
      ));
    elsif (v_item->>'type') = 'fill' and coalesce(v_item->>'answer', '') <> '' then
      v_total := v_total + 1;
      v_expected := lower(trim(regexp_replace(coalesce(v_item->>'answer', ''), '\s+', ' ', 'g')));
      v_ok := lower(trim(regexp_replace(coalesce(v_student #>> '{}', ''), '\s+', ' ', 'g'))) = v_expected;
      if v_ok then v_correct := v_correct + 1; end if;
      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'compositeId', v_key,
        'ok', v_ok
      ));
    end if;
  end loop;

  return jsonb_build_object(
    'correct', v_correct,
    'total', v_total,
    'results', v_results
  );
end;
$$;

grant execute on function public.get_review_quiz(uuid) to authenticated;
grant execute on function public.grade_review_quiz(uuid, jsonb) to authenticated;
