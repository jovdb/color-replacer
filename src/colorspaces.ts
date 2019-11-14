// Because ES6 modules don't merge interfaces
// Placed all colorspaces in one file

// rgb.ts ---------------------------------------------------
declare global {
  export interface IRgb {
    r: number;
    g: number;
    b: number;
  }
}

export function Rgb(r: number, g: number, b: number): IRgb;
export function Rgb(this: IRgb, r: number, g: number, b: number): any {
  this.r = r;
  this.g = g;
  this.b = b;
}

export namespace colorspaces {

  export function mixRgbs(... rgbs: IRgb[]) {
    return new (Rgb as any)(
      rgbs.reduce((r, rgb) => r + rgb.r, 0) / rgbs.length,
      rgbs.reduce((r, rgb) => r + rgb.g, 0) / rgbs.length,
      rgbs.reduce((r, rgb) => r + rgb.b, 0) / rgbs.length,
    );
  }

  export function mixRgb(c1: IRgb, c2: IRgb, amount1 = 1, amount2 = 1) {
    const a = amount1 + amount2 * (1 - amount1);
    return new (Rgb as any)(
      // c1.r * amount1 - (c1.r * amount1 - c2.r * amount2) / 2,
      // c1.g * amount1 - (c1.g * amount1 - c2.g * amount2) / 2,
      // c1.b * amount1 - (c1.b * amount1 - c2.b * amount2) / 2,
      (c1.r * amount1 + c2.r * amount2 * (1 - amount1)) / a,
      (c1.g * amount1 + c2.g * amount2 * (1 - amount1)) / a,
      (c1.b * amount1 + c2.b * amount2 * (1 - amount1)) / a,
    );
  }
}

// hex.ts ---------------------------------------------------
declare global {
  export interface IHex {
    hex: string;
    toRgb(): IRgb;
  }

  export interface IRgb {
    toHex(): string;
  }
}

export namespace colorspaces {

  export function hexToRgb(hexColor: string): IRgb {
    const  result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);

    return result ? new (Rgb as any)(
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ) : null;
  }

  function componentToHex(c: number) {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }

  export function rgbToHex(r: number, g: number, b: number) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

}

export function Hex(this: IHex, h: string): IHex {
  this.hex = h;
  return this as any;
}

Hex.prototype.toRgb = function(this: IHex) {
  return colorspaces.hexToRgb(this.hex);
};

Rgb.prototype.toHex = function(this: IRgb) {
  return colorspaces.rgbToHex(this.r, this.g, this.b);
};

// imageData.ts ---------------------------------------------------
declare global {

  export interface IRgb {
    toImageData(imageData: ImageData, offset: number): IRgb;
  }
}

export namespace colorspaces {

  export function imageDataToRgb(imageData: ImageData, offset: number): IRgb {
    return new (Rgb as any)(
      imageData.data[offset],
      imageData.data[offset + 1],
      imageData.data[offset + 2],
    );
  }

  export function rgbToImageData<TRgb extends IRgb>(rgb: TRgb, imageData: ImageData, offset: number): TRgb {
    imageData.data[offset] = rgb.r;
    imageData.data[offset + 1] = rgb.g;
    imageData.data[offset + 2] = rgb.b;
    return rgb;
  }

}

Rgb.prototype.toImageData = function(imageData: ImageData, offset: number): IRgb {
  return colorspaces.rgbToImageData(this, imageData, offset);
};

// hsl.ts ---------------------------------------------------
declare global {
  export interface IHsl {
    h: number;
    s: number;
    l: number;
    toRgb(): IRgb;
  }

  export interface IRgb {
    toHsl(): IHsl;
  }

}

export namespace colorspaces {

  export function hslToRgb(h: number, s: number, l: number): IRgb {

    function hue2rgb(p: number, q: number, t: number) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    let r = l;
    let g = l;
    let b = l;

    if (s !== 0) {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return new (Rgb as any)(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
    );
  }

  export function rgbToHsl(r: number, g: number, b: number): IHsl {

    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return new (Hsl as any)(h, s, l);
  }
}

export function Hsl(this: IHsl, h: number, s: number, l: number): IHsl {
  this.h = h;
  this.s = s;
  this.l = l;
  return this;
}

Hsl.prototype.toRgb = function(this: IHsl): IRgb {
  return colorspaces.hslToRgb(this.h, this.s, this.l);
};

Rgb.prototype.toHsl = function(this: IRgb): IHsl {
  return colorspaces.rgbToHsl(this.r, this.g, this.b);
};

// ryb.ts ---------------------------------------------------
declare global {
  export interface IRyb {
    r: number;
    y: number;
    b: number;
    toRgb(): IRgb;
  }

  export interface IRgb {
    toRyb(): IHsl;
  }

}

export namespace colorspaces {
  const GOSSET_RYB_TO_RGB = [
    [1.0, 1.0, 1.0],
    [1.0, 0.0, 0.0],
    [1.0, 1.0, 0.0],
    [0.163, 0.373, 0.6],
    [0.5, 0.0, 0.5],
    [0.0, 0.66, 0.2],
    [1.0, 0.5, 0.0],
    [0.2, 0.094, 0.0],
  ];

  const IRISSON_RYB_TO_RGB = [
    [1.0, 1.0, 1.0],
    [1.0, 0.0, 0.0],
    [1.0, 1.0, 0.0],
    [0.163, 0.373, 0.6],
    [0.5, 0.0, 0.5],
    [0.0, 0.66, 0.2],
    [1.0, 0.5, 0.0],
    [0.0, 0.0, 0.0],
  ];

  const IRRISON_RGB_TO_RYB = [
    [1.0, 1.0, 1.0],
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.483],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
    [0.309, 0.0, 0.469],
    [0.0, 0.053, 0.210],
    [0.0, 0.0, 0.0],
  ];

  function convert(r: number, y: number, b: number, convertTable: number[][]) {
    const [f000, f001, f010, f011, f100, f101, f110, f111] = convertTable;

    const r2 = 1.0 -r;
    const y2 = 1.0 - y;
    const b2 = 1.0 - b;

    const c000 = r2 * y2 * b2;
    const c001 = r2 * y2 * b;
    const c010 = r2 * y  * b2;
    const c011 = r * y2 * b2;

    const c100 = r2 * y * b;
    const c101 = r * y2 * b;
    const c110 = r * y * b2;
    const c111 = r * y * b;

    return [
      c000*f000[0] + c001*f001[0] + c010*f010[0] + c011*f011[0] + c100*f100[0] + c101*f101[0] + c110*f110[0] + c111*f111[0],
      c000*f000[1] + c001*f001[1] + c010*f010[1] + c011*f011[1] + c100*f100[1] + c101*f101[1] + c110*f110[1] + c111*f111[1],
      c000*f000[2] + c001*f001[2] + c010*f010[2] + c011*f011[2] + c100*f100[2] + c101*f101[2] + c110*f110[2] + c111*f111[2],
    ];
  }

  export function rybToRgb(r: number, y: number, b: number): IRgb {
    const [r2, g, b2] = convert( r, y, b, IRISSON_RYB_TO_RGB);
    return new (Rgb as any)(r2, g, b2);
  }

  export function rgbToRyb(r: number, g: number, b: number ): IRyb {
    const [r2, y, b2] = convert( r, g, b, IRRISON_RGB_TO_RYB );
    return new (Ryb as any)(r2, y, b2);
  }
}

export function Ryb(this: IRyb, r: number, y: number, b: number): IRyb {
  this.r = r;
  this.y = y;
  this.b = b;
  return this;
}

Ryb.prototype.toRgb = function(this: IRyb): IRgb {
  return colorspaces.rybToRgb(this.r, this.y, this.b);
};

Rgb.prototype.toRyb = function(this: IRgb): IRyb {
  return colorspaces.rgbToRyb(this.r, this.g, this.b);
};
