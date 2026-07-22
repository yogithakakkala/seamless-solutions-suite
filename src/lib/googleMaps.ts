/** Opens the citizen's own Google Maps app/site — not our internal Leaflet map — for actual navigation. */
export function officeMapsUrl(issuingOfficeType: string, nearText = 'Visakhapatnam'): string {
  const query = encodeURIComponent(`${issuingOfficeType} near ${nearText}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function coordinatesMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
