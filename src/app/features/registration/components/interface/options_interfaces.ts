export type ForceOptionInter = {
  value: 'armada' | 'ejercito' | 'fuerza_aerea' | 'policia_nacional';
  label: string;
};
export type ForceOptionM = {
  value: 'armada' | 'ejercito' | 'fuerza_aerea';
  label: string;
};

export type GradesOptionOF ={
  value: 'TK/ST' | 'TF/TE' | 'TN/CT' | 'CC/MY' | 'CF/TC' | 'CN/CR' | 'CA/BG' | 'VC/MG' | 'AL/GR';
  label: string;
}

export type GradesOptionSUB ={
  value: 'MA2/C3' | 'MA1/CS' | 'S3/CP' | 'S2/SS' | 'S1/SV' | 'SJ/SP' | 'JT/SM';
  label: string;
}

export type GradesOptionOFEjer ={
  value: 'ST' | 'TE' | 'CT' | 'MY' | 'TC' | 'CR' | 'CBG' | 'MG' | 'GR';
  label: string;
}

export type GradesOptionSUBEjer ={
  value: 'C3' | 'CS' | 'CP' | 'SS' | 'SV' | 'SP' | 'SM';
  label: string;
}

export type GradesOptionOFAir ={
  value: 'TK/ST' | 'TF/TE' | 'TN/CT' | 'CC/MY' | 'CF/TC' | 'CN/CR' | 'CA/BG' | 'VC/MG' | 'AL/GR';
  label: string;
}

export type GradesOptionSUBAir ={
  value: 'MA2/C3' | 'MA1/CS' | 'S3/CP' | 'S2/SS' | 'S1/SV' | 'SJ/SP' | 'JT/SM';
  label: string;
}

export type CategorieOptionM ={
  value: 'OfficerNavy' | 'OfficerIM' | 'SubofficerNavy' | 'SubofficerIM' | 'IMP' | 'ArmyOfficer' | 'ArmySubofficer' | 'OfficerAir' | 'SubofficerAir';
  label: string;
}


//prueba
export interface Categorias {
  disabled?: boolean;
  name: string;
  categoria: CategorieOptionM[];
}

export type IdTypeOption = { value: 'cc' | 'ti' | 'ce' | 'pasaporte'; label: string };
export type CourseOption = { value: '1' | '2' | '3' | '4'; label: string };
