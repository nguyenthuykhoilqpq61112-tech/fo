const countryCodes: Record<string, string> = {
  Argentina: 'AR',
  Australia: 'AU',
  Austria: 'AT',
  Belgium: 'BE',
  Brazil: 'BR',
  Canada: 'CA',
  Chile: 'CL',
  Colombia: 'CO',
  Croatia: 'HR',
  Denmark: 'DK',
  Ecuador: 'EC',
  England: 'GB',
  France: 'FR',
  Germany: 'DE',
  Ghana: 'GH',
  Italy: 'IT',
  Japan: 'JP',
  Mexico: 'MX',
  Morocco: 'MA',
  Netherlands: 'NL',
  Norway: 'NO',
  Poland: 'PL',
  Portugal: 'PT',
  Senegal: 'SN',
  Serbia: 'RS',
  Spain: 'ES',
  Switzerland: 'CH',
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
};

const palette = ['#10b981', '#38bdf8', '#f59e0b', '#ef4444', '#a78bfa', '#22c55e', '#f97316', '#06b6d4'];

export function flagForTeam(team: string) {
  const code = countryCodes[team] || countryCodes[team.replace(/^IR /, '')];
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
