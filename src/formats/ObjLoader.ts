export class ObjLoader {
    public static readonly VERTEX_TOKEN = 'v';
    public static readonly NORMAL_TOKEN = 'vn';
    public static readonly TEXTURE_TOKEN = 'vt';
    public static readonly FACE_TOKEN = 'f';
    public ParseObj(data: string) {
        const v: number[][] = [];
        const n: number[][] = [];
        const t: number[][] = [];
        const buffer: number[] = [];
        for (const line of data.split('\n')) {
            if (this.ValidateToken(line, ObjLoader.VERTEX_TOKEN)) {
                this.Populate(v, line);
            } else if (this.ValidateToken(line, ObjLoader.NORMAL_TOKEN)) {
                this.Populate(n, line);
            } else if (this.ValidateToken(line, ObjLoader.TEXTURE_TOKEN)) {
                this.Populate(t, line);
            } else if (this.ValidateToken(line, ObjLoader.FACE_TOKEN)) {
                for (const c of line.split(' ')) {
                    c.split('/').forEach((x, i) => {
                        buffer.push.apply(buffer, this.V([v, t, n][i], Number.parseFloat(x)));
                    });
                }
            }
        }
        return buffer;
    }
    public async ParseFromUrl(url: string) {
        return this.ParseObj(await (await fetch(url)).text());
    }
    private V(arr: number[][], index: number) {
        const realIdx = index > 0 ? index - 1 : arr.length + index;

        if (realIdx >= arr.length)
            throw new Error('Array out of bound');

        return arr[realIdx];
    }
    private Populate(target: number[][], line: string) {
        target.push(line.split(' ').slice(1).map(x => Number.parseFloat(x)));
    }
    private ValidateToken(line: string, token: string) {
        return line.startsWith(token + ' ');
    }
}
