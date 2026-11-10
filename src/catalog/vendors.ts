import type { DeviceType } from './devices';

export type ModelRule = string | { readonly prefix: string; readonly type: DeviceType };

export interface VendorRow {
    /** Display name, until the result carries a stable vendor ID. */
    readonly label: string;
    /** A brand word that may precede the model in a User-Agent (`SAMSUNG SM-G960F`). */
    readonly words: readonly string[];
    /** Literal model prefixes, at least two characters. A catch-all pattern cannot be written here. */
    readonly models: readonly ModelRule[];
}

const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const rows = {
    apple: { label: 'Apple', words: ['apple'], models: [] },
    amazon: {
        label: 'Amazon',
        words: ['amazon'],
        models: [
            { prefix: 'AFT', type: 'smart-tv' },
            { prefix: 'KF', type: 'tablet' },
        ],
    },
    asus: { label: 'Asus', words: ['asus'], models: ['ASUS'] },
    google: { label: 'Google', words: ['google'], models: ['Pixel', 'Nexus'] },
    honor: { label: 'Honor', words: ['honor'], models: ['GDI-', 'JDN-', 'BKL-', 'BVL-'] },
    huawei: {
        label: 'Huawei',
        words: ['huawei'],
        models: [
            'HUAWEI',
            'ALN-',
            'ALT-',
            'ANE-',
            'BRA-',
            'CET-',
            'ELE-',
            'ELS-',
            'JAD-',
            'LIO-',
            'NOH-',
            'OCE-',
            'PAL-',
            'VOG-',
        ],
    },
    infinix: { label: 'Infinix', words: ['infinix'], models: ['X68', 'X6', 'X5', 'X7', 'X3'] },
    itel: { label: 'itel', words: ['itel'], models: ['itel', 'A6', 'A5', 'A7', 'A1', 'P5', 'L6'] },
    lg: { label: 'LG', words: ['lg'], models: ['LG-', 'LM-'] },
    meta: { label: 'Meta', words: ['meta'], models: [] },
    motorola: {
        label: 'Motorola',
        words: ['motorola'],
        models: ['moto', ...digits.map((digit) => `XT${digit}`)],
    },
    nokia: { label: 'Nokia', words: ['nokia'], models: ['Nokia', 'TA-'] },
    nothing: { label: 'Nothing', words: ['nothing'], models: ['A06', 'A05', 'A02', 'A14', 'A01'] },
    oneplus: {
        label: 'OnePlus',
        words: ['oneplus'],
        // Oppo and OnePlus share `CPH` and `OPD` prefixes, so the OnePlus codes are listed in full.
        models: [
            'ONEPLUS',
            'IN2',
            'KB2',
            'LE2',
            'NE2',
            'CPH2447',
            'CPH2449',
            'CPH2451',
            'CPH2459',
            'CPH2469',
            'CPH2551',
            'CPH2573',
            'CPH2581',
            'CPH2583',
            'CPH2585',
            'CPH2605',
            'CPH2609',
            'CPH2611',
            'CPH2645',
            'CPH2647',
            'CPH2649',
            'CPH2653',
            'CPH2655',
            'CPH2691',
            'OPD2203',
            'OPD2304',
            'OPD2305',
            'OPD2403',
            'OPD2404',
            'OPD2407',
            'OPD2504',
            'OPD2505',
        ],
    },
    oppo: { label: 'Oppo', words: ['oppo'], models: ['CPH', 'OPPO'] },
    realme: { label: 'Realme', words: ['realme'], models: ['RMX'] },
    samsung: {
        label: 'Samsung',
        words: ['samsung'],
        models: ['SM-', 'SCG', 'GT-', 'SCH-', 'SGH-'],
    },
    sony: {
        label: 'Sony',
        words: ['sony'],
        models: ['XQ-', { prefix: 'BRAVIA', type: 'smart-tv' }],
    },
    tecno: { label: 'Tecno', words: ['tecno'], models: ['TECNO', 'KC'] },
    vivo: { label: 'Vivo', words: ['vivo'], models: ['vivo', 'V1', 'V2'] },
    xiaomi: {
        label: 'Xiaomi',
        words: ['xiaomi'],
        models: ['Xiaomi ', 'MI ', 'MIX ', 'Redmi', 'POCO'],
    },
    zte: { label: 'ZTE', words: ['zte'], models: ['ZTE', 'BLADE'] },
} as const satisfies Readonly<Record<string, VendorRow>>;

export type VendorId = keyof typeof rows;
export const VENDORS: Readonly<Record<VendorId, VendorRow>> = rows;
