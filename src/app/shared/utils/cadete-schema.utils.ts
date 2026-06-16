import type {
  CredentialFieldSchema,
  CredentialTypeSchema,
} from '../../core/models/credential-type.model';

/** Valores sugeridos al elegir grado aspirante (editables). */
export const CADETE_ASPIRANT_DEFAULTS = {
  grado: 'aspirante',
  compania: 'binney',
  curso: '1.1',
} as const;

export const CADETE_GRADO_OPTIONS = ['aspirante', 'cadete', 'guardiamarina', 'alferez'] as const;

export const CADETE_COMPANIA_OPTIONS = ['binney', 'tono', 'brion', 'padilla'] as const;

export const CADETE_CURSO_OPTIONS = [
  '1.1',
  '1.2',
  '2.1',
  '2.2',
  '3.1',
  '3.2',
  '4.1',
  '4.2',
] as const;

const CADETE_CORE_FIELD_NAMES = ['grado', 'compania', 'curso'] as const;

type CadeteCoreFieldName = (typeof CADETE_CORE_FIELD_NAMES)[number];

/** Nombres legacy del API → nombre canónico en metadata. */
const CADETE_FIELD_ALIASES: Record<string, CadeteCoreFieldName> = {
  grades: 'grado',
  grade: 'grado',
  rank: 'grado',
  company: 'compania',
  unit: 'compania',
  sport: 'compania',
  course: 'curso',
};

/** Normaliza claves legacy de metadata/detalles al esquema canónico cadetes. */
export function normalizeCadeteDetailValues(
  source: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!source) return {};

  const values = { ...source };

  for (const [legacy, canonical] of Object.entries(CADETE_FIELD_ALIASES)) {
    if (values[legacy] !== undefined && values[canonical] === undefined) {
      values[canonical] = values[legacy];
    }
  }

  if (values['categorie'] !== undefined && values['category'] === undefined) {
    values['category'] = values['categorie'];
  }

  return values;
}

const CADETE_OPTION_LABELS: Record<string, string> = {
  aspirante: 'Aspirante',
  cadete: 'Cadete',
  guardiamarina: 'Guardiamarina',
  alferez: 'Alférez',
  binney: 'Binney',
  tono: 'Tono',
  brion: 'Brion',
  padilla: 'Padilla',
};

export function isCadeteType(typeCode: string): boolean {
  const normalized = typeCode.trim().toLowerCase().replace(/_/g, '-');
  return normalized === 'cadetes' || normalized === 'inter-escuelas';
}

function normalizeCadeteFieldName(name: string): CadeteCoreFieldName | string {
  const key = name.trim().toLowerCase();
  return CADETE_FIELD_ALIASES[key] ?? name;
}

function mergeFieldOptions(
  existing: string[] | undefined,
  incoming: string[] | undefined,
): string[] | undefined {
  const merged = [...new Set([...(existing ?? []), ...(incoming ?? [])])];
  return merged.length > 0 ? merged : undefined;
}

function mergeOptionsByParent(
  existing: Record<string, string[]> | undefined,
  incoming: Record<string, string[]> | undefined,
): Record<string, string[]> {
  const result = { ...(existing ?? {}) };
  for (const [parent, options] of Object.entries(incoming ?? {})) {
    const normalizedParent = normalizeCadeteFieldName(parent);
    const key = typeof normalizedParent === 'string' ? normalizedParent : parent;
    result[key] = mergeFieldOptions(result[key], options) ?? options;
  }
  return result;
}

/**
 * Garantiza schema cadetes con grado → compania → curso aunque el API solo envíe grado
 * o use nombres legacy (grades, company, course).
 */
export function enrichCadeteSchema(schema: CredentialTypeSchema | null | undefined): CredentialTypeSchema {
  const incoming = new Map<string, CredentialFieldSchema>();

  for (const rawField of schema?.fields ?? []) {
    const canonicalName = normalizeCadeteFieldName(rawField.name);
    const existing = incoming.get(canonicalName);
    const normalized = enrichCadeteField({
      ...rawField,
      name: canonicalName,
      dependsOn: rawField.dependsOn
        ? String(normalizeCadeteFieldName(rawField.dependsOn))
        : rawField.dependsOn,
      hiddenWhen: rawField.hiddenWhen
        ? {
            field: String(normalizeCadeteFieldName(rawField.hiddenWhen.field)),
            values: rawField.hiddenWhen.values,
          }
        : undefined,
      autoValueWhen: rawField.autoValueWhen
        ? {
            field: String(normalizeCadeteFieldName(rawField.autoValueWhen.field)),
            values: Object.fromEntries(
              Object.entries(rawField.autoValueWhen.values).map(([key, value]) => [
                key,
                value,
              ]),
            ),
          }
        : undefined,
      options: mergeFieldOptions(existing?.options, rawField.options),
      optionsByParent: mergeOptionsByParent(existing?.optionsByParent, rawField.optionsByParent),
    });

    incoming.set(
      canonicalName,
      existing
        ? {
            ...normalized,
            options: mergeFieldOptions(existing.options, normalized.options),
            optionsByParent: mergeOptionsByParent(
              existing.optionsByParent,
              normalized.optionsByParent,
            ),
            optionLabels: { ...(existing.optionLabels ?? {}), ...(normalized.optionLabels ?? {}) },
          }
        : normalized,
    );
  }

  const coreFields = CADETE_CORE_FIELD_NAMES.map(
    (name) => incoming.get(name) ?? createDefaultCadeteField(name),
  );

  const extras = [...incoming.entries()]
    .filter(([name]) => !CADETE_CORE_FIELD_NAMES.includes(name as CadeteCoreFieldName))
    .map(([, field]) => field);

  return { fields: [...coreFields, ...extras] };
}

function createDefaultCadeteField(name: CadeteCoreFieldName): CredentialFieldSchema {
  switch (name) {
    case 'grado':
      return enrichCadeteField({
        name: 'grado',
        label: 'Grado',
        type: 'select',
        required: true,
        options: [...CADETE_GRADO_OPTIONS],
      });
    case 'compania':
      return enrichCadeteField({
        name: 'compania',
        label: 'Compañía',
        type: 'select',
        required: true,
        dependsOn: 'grado',
        options: [...CADETE_COMPANIA_OPTIONS],
      });
    case 'curso':
      return enrichCadeteField({
        name: 'curso',
        label: 'Curso',
        type: 'select',
        required: true,
        dependsOn: 'compania',
        options: [...CADETE_CURSO_OPTIONS],
      });
  }
}

function enrichCadeteField(field: CredentialFieldSchema): CredentialFieldSchema {
  const optionLabels = { ...CADETE_OPTION_LABELS, ...(field.optionLabels ?? {}) };
  const withoutHidden =
    field.name === 'compania' || field.name === 'curso'
      ? (({ hiddenWhen: _hidden, ...rest }) => rest)(field)
      : field;

  if (withoutHidden.name === 'grado') {
    return {
      ...withoutHidden,
      options: withoutHidden.options?.length ? withoutHidden.options : [...CADETE_GRADO_OPTIONS],
      optionLabels,
    };
  }

  if (withoutHidden.name === 'compania') {
    const optionsByParent = { ...(withoutHidden.optionsByParent ?? {}) };
    for (const grado of CADETE_GRADO_OPTIONS) {
      if (!optionsByParent[grado]?.length) {
        optionsByParent[grado] = [...CADETE_COMPANIA_OPTIONS];
      }
    }

    return {
      ...withoutHidden,
      dependsOn: 'grado',
      options: withoutHidden.options?.length ? withoutHidden.options : [...CADETE_COMPANIA_OPTIONS],
      optionsByParent,
      optionLabels,
      autoValueWhen: {
        field: 'grado',
        values: {
          ...(withoutHidden.autoValueWhen?.field === 'grado'
            ? withoutHidden.autoValueWhen.values
            : {}),
          aspirante: CADETE_ASPIRANT_DEFAULTS.compania,
        },
      },
    };
  }

  if (withoutHidden.name === 'curso') {
    const optionsByParent = { ...(withoutHidden.optionsByParent ?? {}) };
    for (const compania of CADETE_COMPANIA_OPTIONS) {
      if (!optionsByParent[compania]?.length) {
        optionsByParent[compania] = [...CADETE_CURSO_OPTIONS];
      }
    }

    return {
      ...withoutHidden,
      dependsOn: 'compania',
      options: withoutHidden.options?.length ? withoutHidden.options : [...CADETE_CURSO_OPTIONS],
      optionsByParent,
      optionLabels,
      autoValueWhen: {
        field: 'grado',
        values: {
          ...(withoutHidden.autoValueWhen?.field === 'grado'
            ? withoutHidden.autoValueWhen.values
            : {}),
          aspirante: CADETE_ASPIRANT_DEFAULTS.curso,
        },
      },
    };
  }

  return { ...withoutHidden, optionLabels };
}
