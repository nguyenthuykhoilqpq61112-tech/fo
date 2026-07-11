const countryCodes: Record<string, string> = {
  Argentina: 'AR',
  Australia: 'AU',
  Austria: 'AT',
  Algeria: 'DZ',
  Belgium: 'BE',
  'Bosnia and Herzegovina': 'BA',
  Brazil: 'BR',
  'Cabo Verde': 'CV',
  Canada: 'CA',
  Chile: 'CL',
  Colombia: 'CO',
  'Congo DR': 'CD',
  Croatia: 'HR',
  'Czech Republic': 'CZ',
  Denmark: 'DK',
  Ecuador: 'EC',
  Egypt: 'EG',
  England: 'GB',
  France: 'FR',
  Germany: 'DE',
  Ghana: 'GH',
  Haiti: 'HT',
  Iraq: 'IQ',
  Italy: 'IT',
  Jordan: 'JO',
  Japan: 'JP',
  Mexico: 'MX',
  Morocco: 'MA',
  'New Zealand': 'NZ',
  Netherlands: 'NL',
  Norway: 'NO',
  Panama: 'PA',
  Paraguay: 'PY',
  Poland: 'PL',
  Portugal: 'PT',
  Senegal: 'SN',
  Serbia: 'RS',
  Scotland: 'GB',
  Sweden: 'SE',
  Spain: 'ES',
  Switzerland: 'CH',
  Turkiye: 'TR',
  Uzbekistan: 'UZ',
  Uruguay: 'UY',
  'United States': 'US',
  USA: 'US',
  Qatar: 'QA',
  Iran: 'IR',
  Wales: 'GB',
  'Costa Rica': 'CR',
  Cameroon: 'CM',
  Tunisia: 'TN',
  'Saudi Arabia': 'SA',
  'Korea Republic': 'KR',
  'South Korea': 'KR',
  'Cote dIvoire': 'CI',
  "Cote d'Ivoire": 'CI',
  'Curacao': 'CW',
};

const palette = ['#10b981', '#38bdf8', '#f59e0b', '#ef4444', '#a78bfa', '#22c55e', '#f97316', '#06b6d4'];

export function flagForTeam(team: string) {
  const normalizedTeam = team.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const code = countryCodes[team] || countryCodes[normalizedTeam] || countryCodes[team.replace(/^IR /, '')];
  if (!code) return '🏳️';
  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export function teamInitials(team: string) {
  return team
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function teamColor(team: string) {
  const seed = [...team].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[seed % palette.length];
}

export function worldCupTeamSummary(team: string) {
  return {
    flag: flagForTeam(team),
    initials: teamInitials(team),
    color: teamColor(team),
    federation: countryCodes[team] ? countryCodes[team] : 'FIFA',
  };
}
