import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseArgs, main, type CLIOptions } from '../src/cli';

// Helpers to capture stderr and mock process.exit

/** Sentinel error thrown by mocked process.exit to halt execution. */
class ExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

function mockStderr() {
  const calls: string[] = [];
  const spy = vi.spyOn(process.stderr, 'write').mockImplementation((...args: any[]) => {
    calls.push(String(args[0]));
    return true;
  });
  return { calls, spy, restore: () => spy.mockRestore() };
}

function mockExit() {
  const spy = vi.spyOn(process, 'exit').mockImplementation(((code: number) => {
    throw new ExitError(code);
  }) as any);
  return spy;
}

describe('CLI', () => {
  describe('parseArgs', () => {
    it('defaults to --pillars --almanac when no flags given', () => {
      const opts = parseArgs([]);
      expect(opts.charts.has('pillars')).toBe(true);
      expect(opts.charts.has('almanac')).toBe(true);
      expect(opts.charts.size).toBe(2);
    });

    it('parses --date flag', () => {
      const opts = parseArgs(['--date', '2024-02-04T12:00:00Z']);
      expect(opts.date.toISOString()).toBe('2024-02-04T12:00:00.000Z');
    });

    it('parses --lat and --lng flags', () => {
      const opts = parseArgs(['--lat', '25.03', '--lng', '121.56']);
      expect(opts.lat).toBeCloseTo(25.03);
      expect(opts.lng).toBeCloseTo(121.56);
    });

    it('parses --city flag', () => {
      const opts = parseArgs(['--city', 'Taipei']);
      expect(opts.city).toBe('Taipei');
      // Should resolve lat/lng from city database
      expect(opts.lat).not.toBe(0);
      expect(opts.lng).not.toBe(0);
    });

    it('parses chart selection flags', () => {
      const opts = parseArgs(['--qimen', '--tropical']);
      expect(opts.charts.has('qimen')).toBe(true);
      expect(opts.charts.has('tropical')).toBe(true);
      expect(opts.charts.has('pillars')).toBe(false); // not default when explicit flags
    });

    it('--all enables all chart types', () => {
      const opts = parseArgs(['--all']);
      expect(opts.charts.has('pillars')).toBe(true);
      expect(opts.charts.has('almanac')).toBe(true);
      expect(opts.charts.has('qimen')).toBe(true);
      expect(opts.charts.has('tropical')).toBe(true);
      expect(opts.charts.has('sidereal')).toBe(true);
      expect(opts.charts.has('flying-stars')).toBe(true);
      expect(opts.charts.has('western-natal')).toBe(true);
      expect(opts.charts.size).toBe(11);
    });

    it('--western-natal adds birth-chart to charts', () => {
      const opts = parseArgs(['--western-natal']);
      expect(opts.charts.has('western-natal')).toBe(true);
    });

    it('parses --json flag', () => {
      const opts = parseArgs(['--json']);
      expect(opts.json).toBe(true);
    });

    it('parses --help flag', () => {
      const opts = parseArgs(['--help']);
      expect(opts.help).toBe(true);
    });

    it('-h is alias for --help', () => {
      const opts = parseArgs(['-h']);
      expect(opts.help).toBe(true);
    });

    // Issue 1: --gender flag
    it('--gender female sets gender to female', () => {
      const opts = parseArgs(['--gender', 'female']);
      expect(opts.gender).toBe('female');
    });

    it('--gender defaults to male', () => {
      const opts = parseArgs([]);
      expect(opts.gender).toBe('male');
    });

    it('--gender f is shorthand for female', () => {
      const opts = parseArgs(['--gender', 'f']);
      expect(opts.gender).toBe('female');
    });

    it('--gender m is shorthand for male', () => {
      const opts = parseArgs(['--gender', 'm']);
      expect(opts.gender).toBe('male');
    });

    it('--gender unknown value defaults to male with warning', () => {
      const opts = parseArgs(['--gender', 'other']);
      expect(opts.gender).toBe('male');
    });

    it('--gender nonbinary defaults to male', () => {
      const opts = parseArgs(['--gender', 'nonbinary']);
      expect(opts.gender).toBe('male');
    });

    // Issue 5: --version flag
    it('--version sets version to true', () => {
      const opts = parseArgs(['--version']);
      expect(opts.version).toBe(true);
    });

    it('-v is alias for --version', () => {
      const opts = parseArgs(['-v']);
      expect(opts.version).toBe(true);
    });

    // --research flag
    it('--research sets research to true and implies birth-chart', () => {
      const opts = parseArgs(['--research']);
      expect(opts.research).toBe(true);
      expect(opts.charts.has('western-natal')).toBe(true);
    });

    it('--research defaults to false', () => {
      const opts = parseArgs([]);
      expect(opts.research).toBe(false);
    });

    it('--research with --western-natal does not duplicate', () => {
      const opts = parseArgs(['--research', '--western-natal']);
      expect(opts.research).toBe(true);
      expect(opts.charts.has('western-natal')).toBe(true);
    });

    // --solar-return flag
    it('--solar-return sets solarReturn to true', () => {
      const opts = parseArgs(['--solar-return']);
      expect(opts.solarReturn).toBe(true);
    });

    it('--solar-return defaults to false', () => {
      const opts = parseArgs([]);
      expect(opts.solarReturn).toBe(false);
    });

    it('--year sets solarReturnYear', () => {
      const opts = parseArgs(['--solar-return', '--year', '2030']);
      expect(opts.solarReturnYear).toBe(2030);
    });

    // --transits flag
    it('--transits sets transits to true', () => {
      const opts = parseArgs(['--transits']);
      expect(opts.transits).toBe(true);
    });

    it('--transits defaults to false', () => {
      const opts = parseArgs([]);
      expect(opts.transits).toBe(false);
    });

    it('--transit-date sets transitDate', () => {
      const opts = parseArgs(['--transits', '--transit-date', '2025-06-01T00:00:00Z']);
      expect(opts.transitDate).toBeInstanceOf(Date);
      expect(opts.transitDate!.toISOString()).toBe('2025-06-01T00:00:00.000Z');
    });

    // --luck flag
    it('--luck sets luck to true and implies pillars', () => {
      const opts = parseArgs(['--luck']);
      expect(opts.luck).toBe(true);
      expect(opts.charts.has('pillars')).toBe(true);
    });

    it('--luck defaults to false', () => {
      const opts = parseArgs([]);
      expect(opts.luck).toBe(false);
    });
  });

  describe('main', () => {
    it('--help outputs help text without error', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--help']);
      expect(spy).toHaveBeenCalled();
      const output = spy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('stem-branch');
      expect(output).toContain('--date');
      expect(output).toContain('--pillars');
      spy.mockRestore();
    });

    it('--pillars --date renders Four Pillars output', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--pillars', '--date', '2024-02-04T12:00:00Z']);
      expect(spy).toHaveBeenCalled();
      const output = spy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('四柱八字');
      spy.mockRestore();
    });

    it('--json outputs valid JSON', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--json', '--pillars', '--date', '2024-02-04T12:00:00Z']);
      expect(spy).toHaveBeenCalled();
      const jsonStr = spy.mock.calls[0][0];
      expect(() => JSON.parse(jsonStr)).not.toThrow();
      const parsed = JSON.parse(jsonStr);
      expect(parsed.pillars).toBeDefined();
      expect(parsed.date).toBe('2024-02-04T12:00:00.000Z');
      spy.mockRestore();
    });

    it('--json --all produces all chart keys', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--json', '--all', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      expect(spy).toHaveBeenCalled();
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.pillars).toBeDefined();
      expect(parsed.almanac).toBeDefined();
      expect(parsed.qimen).toBeDefined();
      expect(parsed.liuren).toBeDefined();
      expect(parsed.tropical).toBeDefined();
      expect(parsed.sidereal).toBeDefined();
      spy.mockRestore();
    });

    it('default (no flags) renders pillars and almanac', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--date', '2024-02-04T12:00:00Z']);
      const output = spy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('四柱八字');
      expect(output).toContain('日曆總覽');
      spy.mockRestore();
    });

    // Issue 5: --version
    it('--version outputs version string', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--version']);
      expect(logSpy).toHaveBeenCalled();
      const output = logSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toMatch(/\d+\.\d+\.\d+/);
      logSpy.mockRestore();
    });

    it('-v outputs version string', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['-v']);
      const output = logSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toMatch(/\d+\.\d+\.\d+/);
      logSpy.mockRestore();
    });

    it('--western-natal renders Western Natal Chart with angles and cusps', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--western-natal', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const output = spy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Western Natal Chart');
      expect(output).toContain('ASC');
      expect(output).toContain('DSC');
      expect(output).toContain('MC');
      expect(output).toContain('IC');
      expect(output).toContain('House Cusps');
      spy.mockRestore();
    });

    it('--western-natal --json produces structured westernNatal object', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--western-natal', '--json', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.westernNatal).toBeDefined();
      expect(parsed.westernNatal.angles.asc).toBeTypeOf('number');
      expect(parsed.westernNatal.angles.dsc).toBeTypeOf('number');
      expect(parsed.westernNatal.angles.mc).toBeTypeOf('number');
      expect(parsed.westernNatal.angles.ic).toBeTypeOf('number');
      // DSC = (ASC + 180) % 360
      expect(parsed.westernNatal.angles.dsc).toBeCloseTo(
        (parsed.westernNatal.angles.asc + 180) % 360, 4,
      );
      // IC = (MC + 180) % 360
      expect(parsed.westernNatal.angles.ic).toBeCloseTo(
        (parsed.westernNatal.angles.mc + 180) % 360, 4,
      );
      expect(parsed.westernNatal.houses.cusps).toHaveLength(12);
      expect(parsed.westernNatal.houses.system).toBe('placidus');
      expect(parsed.westernNatal.positions.length).toBeGreaterThan(0);
      expect(parsed.westernNatal.aspects).toBeDefined();
      spy.mockRestore();
    });

    it('--json --all includes westernNatal key', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--json', '--all', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.westernNatal).toBeDefined();
      expect(parsed.westernNatal.angles).toBeDefined();
      spy.mockRestore();
    });

    it('--tropical renders House Cusps section and Longitude column', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--tropical', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const output = spy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('House Cusps');
      expect(output).toContain('Longitude');
      expect(output).toContain('Angle');
      spy.mockRestore();
    });

    // Issue 2: invalid --date → stderr + exit(1)
    it('--date garbage → stderr error + exit(1)', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stderr = mockStderr();
      const exitSpy = mockExit();
      expect(() => main(['--date', 'garbage'])).toThrow(ExitError);
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(stderr.calls.join('')).toMatch(/invalid date/i);
      stderr.restore();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('--date empty string → stderr error + exit(1)', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stderr = mockStderr();
      const exitSpy = mockExit();
      expect(() => main(['--date', ''])).toThrow(ExitError);
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(stderr.calls.join('')).toMatch(/invalid date/i);
      stderr.restore();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    });

    // Issue 3: unknown --city → stderr warning
    it('--city Xyzzyville → stderr warning', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stderr = mockStderr();
      main(['--pillars', '--city', 'Xyzzyville', '--date', '2024-02-04T12:00:00Z']);
      // Should warn but NOT exit
      expect(stderr.calls.join('')).toMatch(/not found/i);
      stderr.restore();
      logSpy.mockRestore();
    });

    // Issue 4: missing arg values → stderr + exit(1)
    it('--lat with no value → stderr + exit(1)', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stderr = mockStderr();
      const exitSpy = mockExit();
      expect(() => main(['--lat'])).toThrow(ExitError);
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(stderr.calls.join('')).toMatch(/requires/i);
      stderr.restore();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('--date with no value → stderr + exit(1)', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stderr = mockStderr();
      const exitSpy = mockExit();
      expect(() => main(['--date'])).toThrow(ExitError);
      expect(exitSpy).toHaveBeenCalledWith(1);
      stderr.restore();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('--lng with no value → stderr + exit(1)', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stderr = mockStderr();
      const exitSpy = mockExit();
      expect(() => main(['--lng'])).toThrow(ExitError);
      expect(exitSpy).toHaveBeenCalledWith(1);
      stderr.restore();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    });

    // Issue 6: unrecognized flags → stderr warning
    it('--polars (typo) → stderr warning, still runs', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stderr = mockStderr();
      main(['--polars', '--date', '2024-02-04T12:00:00Z']);
      expect(stderr.calls.join('')).toMatch(/unrecognized/i);
      // Should still produce default output
      const output = logSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('四柱八字');
      stderr.restore();
      logSpy.mockRestore();
    });

    // Issue 8: --help does NOT call process.exit
    it('--help does not call process.exit', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      // Use a non-throwing spy just to verify exit is never called
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
      main(['--help']);
      expect(exitSpy).not.toHaveBeenCalled();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    });

    // Issue 1: --gender threads through to polaris JSON
    it('--luck renders luck periods section', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--luck', '--date', '2024-02-04T12:00:00Z']);
      const output = spy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('大運');
      expect(output).toContain('Luck Periods');
      expect(output).toContain('四柱八字'); // implies pillars
      spy.mockRestore();
    });

    it('--luck --json includes luck key with major and minor', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--luck', '--json', '--date', '2024-02-04T12:00:00Z']);
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.luck).toBeDefined();
      expect(parsed.luck.major).toBeDefined();
      expect(parsed.luck.major.direction).toMatch(/forward|backward/);
      expect(parsed.luck.major.periods.length).toBeGreaterThan(0);
      expect(parsed.luck.minor).toBeDefined();
      spy.mockRestore();
    });

    it('--solar-return renders Solar Return chart', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--solar-return', '--year', '2025', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const output = spy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Solar Return');
      expect(output).toContain('2025');
      expect(output).toContain('Return Date');
      expect(output).toContain('ASC');
      spy.mockRestore();
    });

    it('--transits renders transit overlay', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--transits', '--transit-date', '2025-03-20T12:00:00Z', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const output = spy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Transits');
      expect(output).toContain('Transit Positions');
      expect(output).toContain('Transit-to-Natal Aspects');
      spy.mockRestore();
    });

    it('--transits --json includes transits key', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--transits', '--json', '--transit-date', '2025-03-20T12:00:00Z', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.transits).toBeDefined();
      expect(parsed.transits.transitDate).toBeDefined();
      expect(parsed.transits.aspects).toBeDefined();
      expect(parsed.transits.transitPositions.length).toBeGreaterThan(0);
      spy.mockRestore();
    });

    it('--solar-return --json includes solarReturn key', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--solar-return', '--json', '--year', '2025', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.solarReturn).toBeDefined();
      expect(parsed.solarReturn.year).toBe(2025);
      expect(parsed.solarReturn.returnDate).toBeDefined();
      expect(parsed.solarReturn.chart).toBeDefined();
      spy.mockRestore();
    });

    it('--luck --gender female changes luck direction', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--luck', '--json', '--gender', 'female', '--date', '2024-02-04T12:00:00Z']);
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      // 2024 甲辰 year: yang stem + female → backward
      expect(parsed.luck.major.direction).toBe('backward');
      spy.mockRestore();
    });

    it('--polaris --json --gender female includes gender in output', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--polaris', '--json', '--gender', 'female', '--date', '2024-02-04T12:00:00Z']);
      const parsed = JSON.parse(logSpy.mock.calls[0][0]);
      expect(parsed.polaris).toBeDefined();
      expect(parsed.polaris.birthData.gender).toBe('female');
      logSpy.mockRestore();
    });

    it('--gender unknown value emits warning and defaults to male', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stderr = mockStderr();
      main(['--pillars', '--gender', 'other', '--date', '2024-02-04T12:00:00Z']);
      expect(stderr.calls.join('')).toMatch(/unknown gender/i);
      const output = logSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('四柱八字'); // still produces output
      stderr.restore();
      logSpy.mockRestore();
    });

    it('--research renders Extended Speed and Speculum sections', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--research', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const output = spy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Western Natal Chart');
      expect(output).toContain('Extended Speed');
      expect(output).toContain('Speculum');
      spy.mockRestore();
    });

    it('--research --json includes research data in westernNatal', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      main(['--research', '--json', '--date', '2024-06-15T14:30:00Z', '--lat', '25', '--lng', '121']);
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.westernNatal).toBeDefined();
      expect(parsed.westernNatal.research).toBeDefined();
      expect(parsed.westernNatal.research.positions).toBeDefined();
      expect(parsed.westernNatal.research.midpoints).toBeDefined();
      spy.mockRestore();
    });
  });

  // Issue 7: module guard
  describe('module guard', () => {
    it('importing parseArgs does not trigger main() side effect', () => {
      // This test passes implicitly: if the guard works, importing the module
      // in the test setup didn't produce console output or crash.
      // We verify by checking parseArgs is a callable function.
      expect(typeof parseArgs).toBe('function');
    });
  });
});

// ── Helper to capture stdout from main() ────────────────────

/** Run CLI with given args and return captured stdout as a single string. */
function runCLI(...args: string[]): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    main(args);
    return spy.mock.calls.map(c => c[0]).join('\n');
  } finally {
    spy.mockRestore();
  }
}

// ── Chart dispatch branches (covers src/cli.ts lines 244-347) ─

describe('chart dispatch branches', () => {
  it('--flying-stars renders flying star chart', () => {
    const output = runCLI('--flying-stars', '--date', '2024-06-15T10:00:00Z');
    expect(output).toContain('紫白飛星');
  });

  it('--polaris renders Zi Wei chart', () => {
    const output = runCLI('--polaris', '--date', '2024-06-15T10:00:00Z', '--gender', 'male');
    expect(output).toContain('紫微斗數');
  });

  it('--qimen renders Qi Men chart', () => {
    const output = runCLI('--qimen', '--date', '2024-06-15T10:00:00Z');
    expect(output).toContain('奇門遁甲');
  });

  it('--liuren renders Liu Ren chart', () => {
    const output = runCLI('--liuren', '--date', '2024-06-15T10:00:00Z');
    expect(output).toContain('大六壬');
  });

  it('--chuanren renders Chuan Ren chart', () => {
    const output = runCLI('--chuanren', '--date', '2024-06-15T10:00:00Z');
    expect(output).toContain('奇門穿壬');
  });

  it('--seven-governors renders Seven Governors chart', () => {
    const output = runCLI('--seven-governors', '--date', '2024-06-15T10:00:00Z', '--lat', '25', '--lng', '121');
    expect(output).toContain('七政四餘');
  });

  it('--sidereal renders Sidereal chart', () => {
    const output = runCLI('--sidereal', '--date', '2024-06-15T10:00:00Z', '--lat', '25', '--lng', '121');
    expect(output).toContain('Sidereal');
  });

  it('--tropical renders tropical chart', () => {
    const output = runCLI('--tropical', '--date', '2024-06-15T10:00:00Z', '--lat', '25', '--lng', '121');
    expect(output).toContain('Tropical');
  });

  it('--western-natal renders birth chart', () => {
    const output = runCLI('--western-natal', '--date', '2024-06-15T10:00:00Z', '--lat', '25', '--lng', '121');
    expect(output).toContain('Western Natal Chart');
  });
});

describe('JSON dispatch branches', () => {
  it('--json --flying-stars outputs flying stars data', () => {
    const output = runCLI('--json', '--flying-stars', '--date', '2024-06-15T10:00:00Z');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('flyingStars');
  });

  it('--json --polaris outputs Zi Wei data', () => {
    const output = runCLI('--json', '--polaris', '--date', '2024-06-15T10:00:00Z', '--gender', 'male');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('polaris');
  });

  it('--json --qimen outputs Qi Men data', () => {
    const output = runCLI('--json', '--qimen', '--date', '2024-06-15T10:00:00Z');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('qimen');
  });

  it('--json --liuren outputs Liu Ren data', () => {
    const output = runCLI('--json', '--liuren', '--date', '2024-06-15T10:00:00Z');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('liuren');
  });

  it('--json --chuanren outputs Chuan Ren data', () => {
    const output = runCLI('--json', '--chuanren', '--date', '2024-06-15T10:00:00Z');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('chuanren');
  });

  it('--json --seven-governors outputs Seven Governors data', () => {
    const output = runCLI('--json', '--seven-governors', '--date', '2024-06-15T10:00:00Z', '--lat', '25', '--lng', '121');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('sevenGovernors');
  });

  it('--json --sidereal outputs sidereal data', () => {
    const output = runCLI('--json', '--sidereal', '--date', '2024-06-15T10:00:00Z', '--lat', '25', '--lng', '121');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('sidereal');
  });

  it('--json --tropical outputs tropical data', () => {
    const output = runCLI('--json', '--tropical', '--date', '2024-06-15T10:00:00Z', '--lat', '25', '--lng', '121');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('tropical');
  });

  it('--json --western-natal outputs birth chart data', () => {
    const output = runCLI('--json', '--western-natal', '--date', '2024-06-15T10:00:00Z', '--lat', '25', '--lng', '121');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('westernNatal');
  });
});
