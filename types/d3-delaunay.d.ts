declare module "d3-delaunay" {
  export class Delaunay {
    static from(points: ArrayLike<[number, number]>): Delaunay;
    voronoi(bounds: [number, number, number, number]): Voronoi;
  }
  export class Voronoi {
    renderCell(i: number): string;
  }
}
