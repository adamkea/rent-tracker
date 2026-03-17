/**
 * Approximate geographic centre [longitude, latitude] for each CSO rental area.
 * Keys match the CSO location string or the area-name portion (before the county).
 * Used to place markers on the Ireland geo map.
 */
const COORDS: Record<string, [number, number]> = {
  // ── Dublin (postal districts) ─────────────────────────────────────────────
  "Dublin 1":   [-6.258, 53.349],
  "Dublin 2":   [-6.263, 53.340],
  "Dublin 3":   [-6.207, 53.366],
  "Dublin 4":   [-6.225, 53.325],
  "Dublin 5":   [-6.193, 53.375],
  "Dublin 6":   [-6.262, 53.319],
  "Dublin 6W":  [-6.289, 53.306],
  "Dublin 7":   [-6.280, 53.358],
  "Dublin 8":   [-6.300, 53.338],
  "Dublin 9":   [-6.250, 53.374],
  "Dublin 10":  [-6.348, 53.340],
  "Dublin 11":  [-6.276, 53.375],
  "Dublin 12":  [-6.302, 53.317],
  "Dublin 13":  [-6.137, 53.391],
  "Dublin 14":  [-6.258, 53.295],
  "Dublin 15":  [-6.376, 53.390],
  "Dublin 16":  [-6.263, 53.282],
  "Dublin 17":  [-6.210, 53.389],
  "Dublin 18":  [-6.213, 53.272],
  "Dublin 20":  [-6.372, 53.343],
  "Dublin 22":  [-6.396, 53.325],
  "Dublin 24":  [-6.374, 53.285],

  // ── Cork ──────────────────────────────────────────────────────────────────
  "Cork City":           [-8.474, 51.898],
  "Cork City Centre":    [-8.474, 51.898],
  "Ballincollig":        [-8.588, 51.891],
  "Ballintemple":        [-8.431, 51.884],
  "Bandon":              [-8.742, 51.749],
  "Blarney":             [-8.560, 51.933],
  "Carrigaline":         [-8.401, 51.820],
  "Carrigtohill":        [-8.255, 51.912],
  "Clonakilty":          [-8.904, 51.623],
  "Cobh":                [-8.297, 51.851],
  "Douglas":             [-8.443, 51.869],
  "Fermoy":              [-8.271, 52.138],
  "Glanmire":            [-8.416, 51.923],
  "Kinsale":             [-8.524, 51.706],
  "Little Island":       [-8.364, 51.902],
  "Macroom":             [-8.960, 51.905],
  "Mallow":              [-8.652, 52.138],
  "Midleton":            [-8.171, 51.917],
  "Montenotte":          [-8.454, 51.910],
  "Passage West":        [-8.337, 51.873],
  "Rochestown":          [-8.437, 51.861],
  "Ringaskiddy":         [-8.320, 51.832],
  "Skibbereen":          [-9.260, 51.553],
  "Togher":              [-8.504, 51.877],
  "Youghal":             [-7.847, 51.958],

  // ── Galway ────────────────────────────────────────────────────────────────
  "Galway City":         [-9.050, 53.270],
  "Galway City Centre":  [-9.050, 53.270],
  "Salthill":            [-9.080, 53.257],
  "Athenry":             [-8.748, 53.299],
  "Ballinasloe":         [-8.220, 53.331],
  "Clifden":             [-10.022, 53.489],
  "Gort":                [-8.820, 53.062],
  "Headford":            [-9.109, 53.468],
  "Loughrea":            [-8.568, 53.200],
  "Oranmore":            [-8.925, 53.273],
  "Portumna":            [-8.207, 53.092],
  "Tuam":                [-8.856, 53.514],

  // ── Limerick ──────────────────────────────────────────────────────────────
  "Limerick City":       [-8.630, 52.666],
  "Castletroy":          [-8.559, 52.674],
  "Dooradoyle":          [-8.666, 52.633],
  "Kilmallock":          [-8.575, 52.400],
  "Mungret":             [-8.686, 52.640],
  "Newcastle West":      [-9.053, 52.443],
  "Rathkeale":           [-8.938, 52.524],

  // ── Tipperary ─────────────────────────────────────────────────────────────
  "Cahir":               [-7.922, 52.377],
  "Carrick-on-Suir":     [-7.418, 52.347],
  "Cashel":              [-7.889, 52.516],
  "Clonmel":             [-7.699, 52.356],
  "Nenagh":              [-8.197, 52.861],
  "Roscrea":             [-7.797, 52.952],
  "Templemore":          [-7.833, 52.792],
  "Thurles":             [-7.803, 52.682],
  "Tipperary Town":      [-8.153, 52.473],

  // ── Waterford ─────────────────────────────────────────────────────────────
  "Waterford City":      [-7.110, 52.258],
  "Dungarvan":           [-7.626, 52.091],
  "Tramore":             [-7.151, 52.162],

  // ── Kerry ─────────────────────────────────────────────────────────────────
  "Killarney":           [-9.506, 52.058],
  "Listowel":            [-9.488, 52.444],
  "Tralee":              [-9.710, 52.270],
  "Kenmare":             [-9.585, 51.880],
  "Kilorglin":           [-9.782, 52.102],

  // ── Kildare ───────────────────────────────────────────────────────────────
  "Athy":                [-6.985, 52.988],
  "Celbridge":           [-6.540, 53.338],
  "Kildare Town":        [-6.914, 53.157],
  "Kilcock":             [-6.670, 53.408],
  "Leixlip":             [-6.490, 53.362],
  "Maynooth":            [-6.591, 53.381],
  "Naas":                [-6.656, 53.215],
  "Newbridge":           [-6.796, 53.180],
  "Clane":               [-6.686, 53.296],
  "Kilcullen":           [-6.745, 53.126],
  "Monasterevin":        [-7.068, 53.148],

  // ── Wicklow ───────────────────────────────────────────────────────────────
  "Arklow":              [-6.151, 52.799],
  "Bray":                [-6.097, 53.201],
  "Greystones":          [-6.063, 53.143],
  "Rathnew":             [-6.087, 52.988],
  "Wicklow Town":        [-6.044, 52.980],
  "Wicklow":             [-6.044, 52.980],
  "Enniskerry":          [-6.166, 53.192],

  // ── Louth ─────────────────────────────────────────────────────────────────
  "Ardee":               [-6.541, 53.859],
  "Drogheda":            [-6.356, 53.718],
  "Dundalk":             [-6.404, 54.000],
  "Dunleer":             [-6.400, 53.826],

  // ── Meath ─────────────────────────────────────────────────────────────────
  "Ashbourne":           [-6.399, 53.507],
  "Duleek":              [-6.422, 53.656],
  "Dunboyne":            [-6.472, 53.424],
  "Dunshaughlin":        [-6.540, 53.514],
  "Kells":               [-6.879, 53.726],
  "Laytown":             [-6.222, 53.696],
  "Laytown-Bettystown":  [-6.222, 53.696],
  "Navan":               [-6.689, 53.654],
  "Oldcastle":           [-7.159, 53.771],
  "Ratoath":             [-6.464, 53.508],
  "Trim":                [-6.790, 53.554],

  // ── Wexford ───────────────────────────────────────────────────────────────
  "Enniscorthy":         [-6.572, 52.502],
  "Gorey":               [-6.294, 52.674],
  "New Ross":            [-6.944, 52.396],
  "Wexford Town":        [-6.459, 52.336],
  "Wexford":             [-6.459, 52.336],

  // ── Kilkenny ──────────────────────────────────────────────────────────────
  "Callan":              [-7.391, 52.546],
  "Castlecomer":         [-7.209, 52.802],
  "Kilkenny City":       [-7.254, 52.651],
  "Kilkenny":            [-7.254, 52.651],
  "Thomastown":          [-7.140, 52.524],

  // ── Carlow ────────────────────────────────────────────────────────────────
  "Carlow Town":         [-6.925, 52.833],
  "Carlow":              [-6.925, 52.833],
  "Muinebheag":          [-6.958, 52.669],
  "Tullow":              [-6.735, 52.800],

  // ── Laois ─────────────────────────────────────────────────────────────────
  "Mountmellick":        [-7.330, 53.116],
  "Portarlington":       [-7.178, 53.163],
  "Portlaoise":          [-7.300, 53.033],

  // ── Offaly ────────────────────────────────────────────────────────────────
  "Birr":                [-7.913, 53.096],
  "Clara":               [-7.614, 53.339],
  "Edenderry":           [-7.049, 53.343],
  "Tullamore":           [-7.487, 53.277],

  // ── Westmeath ─────────────────────────────────────────────────────────────
  "Athlone":             [-7.940, 53.424],
  "Mullingar":           [-7.337, 53.524],

  // ── Longford ──────────────────────────────────────────────────────────────
  "Granard":             [-7.493, 53.778],
  "Longford Town":       [-7.796, 53.726],
  "Longford":            [-7.796, 53.726],

  // ── Cavan ─────────────────────────────────────────────────────────────────
  "Bailieborough":       [-6.962, 53.920],
  "Cavan Town":          [-7.360, 53.990],
  "Cavan":               [-7.360, 53.990],
  "Cootehill":           [-7.084, 54.070],
  "Virginia":            [-7.081, 53.831],

  // ── Monaghan ──────────────────────────────────────────────────────────────
  "Carrickmacross":      [-6.722, 53.974],
  "Castleblayney":       [-6.736, 54.118],
  "Clones":              [-7.231, 54.177],
  "Monaghan Town":       [-6.968, 54.249],
  "Monaghan":            [-6.968, 54.249],

  // ── Leitrim ───────────────────────────────────────────────────────────────
  "Carrick-on-Shannon":  [-8.088, 53.944],
  "Manorhamilton":       [-8.178, 54.308],

  // ── Roscommon ─────────────────────────────────────────────────────────────
  "Ballaghaderreen":     [-8.574, 53.902],
  "Boyle":               [-8.299, 53.977],
  "Roscommon Town":      [-8.188, 53.632],
  "Roscommon":           [-8.188, 53.632],
  "Strokestown":         [-8.102, 53.779],

  // ── Mayo ──────────────────────────────────────────────────────────────────
  "Ballina":             [-9.155, 54.115],
  "Ballinrobe":          [-9.220, 53.628],
  "Ballyhaunis":         [-8.763, 53.763],
  "Castlebar":           [-9.299, 53.857],
  "Claremorris":         [-8.978, 53.720],
  "Westport":            [-9.519, 53.800],

  // ── Sligo ─────────────────────────────────────────────────────────────────
  "Ballymote":           [-8.515, 53.901],
  "Sligo Town":          [-8.476, 54.270],
  "Sligo":               [-8.476, 54.270],
  "Tubbercurry":         [-8.727, 53.994],

  // ── Donegal ───────────────────────────────────────────────────────────────
  "Ballyshannon":        [-8.189, 54.497],
  "Buncrana":            [-7.453, 55.132],
  "Bundoran":            [-8.280, 54.477],
  "Carndonagh":          [-7.265, 55.254],
  "Donegal Town":        [-8.107, 54.655],
  "Letterkenny":         [-7.734, 54.952],

  // ── Clare ─────────────────────────────────────────────────────────────────
  "Ennis":               [-8.982, 52.843],
  "Killaloe":            [-8.445, 52.803],
  "Kilrush":             [-9.487, 52.637],
  "Shannon":             [-8.863, 52.704],
};

/**
 * Returns [longitude, latitude] for a CSO location string, or null if unknown.
 * Tries exact match first, then the area portion before the last comma.
 */
export function getAreaCoords(location: string): [number, number] | null {
  if (COORDS[location]) return COORDS[location];

  const commaIdx = location.lastIndexOf(",");
  if (commaIdx !== -1) {
    // "Naas, Kildare" → try "Naas"
    const area = location.slice(0, commaIdx).trim();
    if (COORDS[area]) return COORDS[area];

    // "Ballsbridge, Dublin 4" → try "Dublin 4"
    const after = location.slice(commaIdx + 1).trim();
    if (COORDS[after]) return COORDS[after];
  }

  return null;
}
