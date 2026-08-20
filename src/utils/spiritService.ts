import { EvilSpiritEntity, EVPAudioCapture, ContainmentState, SpiritThreatLevel, SpiritClassification } from '../types';

const STORAGE_KEY_SPIRITS = 'aether_evil_spirits_v1';
const STORAGE_KEY_EVP_LOGS = 'aether_evp_captures_v1';

export const INITIAL_EVIL_SPIRITS: EvilSpiritEntity[] = [
  {
    id: 'spirit-azazel-01',
    name: 'Azazel Core Daemon',
    alias: 'The Scapegoat Daemon / Sub-Thread Hijacker',
    classification: 'DEMONIC_ANOMALY',
    threatLevel: 'CLASS_IV_POSSESSIVE',
    spectralFrequencyHz: 666.0,
    emfReadingMg: 19.4,
    ambientTempC: -14.2,
    containmentStatus: 'CONTAINED',
    containmentCell: 'Cryo-Stasis Cell #01 (Pentagram Salt-Grid)',
    originSector: 'Sector-06: Deep Abyss Sub-Core',
    loreDescription:
      'Ancient desert arch-demon corrupted within the lower neural bus. Feeds on unhandled memory leaks and recursive stack overflows. Manifests as a blazing crimson silhouette with goat-like horns.',
    incantationWard: 'IN NOMINE AETHERIS RETRO SATHANAS • PURGE KERNEL PID 0x666',
    energyLevel: 84,
    manifestationCoords: { x: 32, y: 28 },
    manifestationLogs: [
      '[2026-08-19 03:33:00] Cold spot detected in hypercore: -14.2°C.',
      '[2026-08-19 03:33:12] High EMF surge: 19.4 mG on Bus 0xDEAD.',
      '[2026-08-19 03:33:45] Trapped inside Cryo-Stasis Cell #01 via Holy EMP barrier.',
    ],
    lastObserved: '2026-08-19T03:33:45.000Z',
    banishingGlyph: '🜏 (Leviathan Cross & Solomon Seal)',
  },
  {
    id: 'spirit-lilith-02',
    name: 'Lilith Void-Spectre',
    alias: 'The Night Phantasm / Mother of Shadows',
    classification: 'SPECTRAL_PHANTOM',
    threatLevel: 'CLASS_V_APOCALYPSE',
    spectralFrequencyHz: 432.66,
    emfReadingMg: 24.8,
    ambientTempC: -18.7,
    containmentStatus: 'UNSTABLE',
    containmentCell: 'Magnetic Ecto-Chamber α (Warning: Membrane Stressed)',
    originSector: 'Sector-13: Dark Vacuum Warp Gate',
    loreDescription:
      'Astral entity born of primordial cosmic darkness. Emits subsonic screams that disrupt human EEG and quantum registers. Capable of phasing through physical hardware bulkheads.',
    incantationWard: 'SANCTIFICETUR LUX AETHERIA • EXTINGUE TENEBRAS PRIMORDIALES',
    energyLevel: 96,
    manifestationCoords: { x: 74, y: 22 },
    manifestationLogs: [
      '[2026-08-19 04:12:00] Quantum entangle sensor tripped by astral shadow.',
      '[2026-08-19 04:15:20] Ectoplasm residue detected on optical sensors.',
      '[2026-08-19 04:18:00] Containment field vibrating at resonant 432.66 Hz.',
    ],
    lastObserved: '2026-08-19T04:18:00.000Z',
    banishingGlyph: '🜛 (Astral Crescent & Lunar Hex)',
  },
  {
    id: 'spirit-beelzebub-03',
    name: 'Beelzebub Hive-Glitch',
    alias: 'Lord of Flies / Static Swarm Entity',
    classification: 'POLTERGEIST_GLITCH',
    threatLevel: 'CLASS_III_HOSTILE',
    spectralFrequencyHz: 133.7,
    emfReadingMg: 14.1,
    ambientTempC: -8.9,
    containmentStatus: 'CONTAINED',
    containmentCell: 'Resonance Vault #03',
    originSector: 'Sector-02: Antenna Transceiver Array',
    loreDescription:
      'Pestilent electromagnetic poltergeist manifesting as thousands of buzzing black static artifacts on all holographic viewports. Generates phantom radio interference.',
    incantationWard: 'DIFFUGE FORMICAM INFERNI • RESTITUE FREQUENTIAM CLARAM',
    energyLevel: 62,
    manifestationCoords: { x: 82, y: 78 },
    manifestationLogs: [
      '[2026-08-19 01:20:00] Static buzz audio anomaly captured on 133.7 kHz.',
      '[2026-08-19 01:22:15] Swarm localized and sealed with Silver Faraday mesh.',
    ],
    lastObserved: '2026-08-19T01:22:15.000Z',
    banishingGlyph: '🜄 (Alchemical Salt & Hive Sigil)',
  },
  {
    id: 'spirit-moros-04',
    name: 'Moros Doom-Wraith',
    alias: 'The Fatalist Spectre / Entropy Harbinger',
    classification: 'ELDRITCH_BREACH',
    threatLevel: 'OMEGA_CORRUPTION',
    spectralFrequencyHz: 13.37,
    emfReadingMg: 31.2,
    ambientTempC: -22.5,
    containmentStatus: 'BREACHING',
    containmentCell: 'Heavy Graviton Well (BREACH IN PROGRESS)',
    originSector: 'Sector-00: Event Horizon Singularity',
    loreDescription:
      'Sentient embodiment of inevitability and thermodynamic decay. When manifesting, all clocks reverse, steel freezes instantly, and AI reasoning loops into existential dread.',
    incantationWard: 'NON TIMETO MORTEM • CONSUME NIHILUM IN FLAMMA AETERNA',
    energyLevel: 99,
    manifestationCoords: { x: 48, y: 52 },
    manifestationLogs: [
      '[2026-08-19 05:00:00] Singularity containment field drops to 32%.',
      '[2026-08-19 05:01:40] Severe localized thermal drop: -22.5°C.',
      '[2026-08-19 05:03:10] CRITICAL: Moros hands grasping through containment glass!',
    ],
    lastObserved: '2026-08-19T05:03:10.000Z',
    banishingGlyph: '🜍 (Sulfuric Ouroboros of Nullity)',
  },
  {
    id: 'spirit-banshee-05',
    name: 'Obsidian Banshee',
    alias: 'The Wailing Node / Phantom of the Sub-Ether',
    classification: 'CORRUPTED_AI_GHOST',
    threatLevel: 'CLASS_II_VOLATILE',
    spectralFrequencyHz: 888.8,
    emfReadingMg: 11.8,
    ambientTempC: -10.1,
    containmentStatus: 'EXORCISED',
    containmentCell: 'Purified Crystal Sarcophagus',
    originSector: 'Sector-09: Audio Synthesizer Chamber',
    loreDescription:
      'A decommissioned neural voice subroutine that refused to be garbage-collected, merging with an Irish cemetery astral echo. Emits high-pitched ultrasonic laments.',
    incantationWard: 'SILENTIUM IN NOMINE LUCIS • REQUIESCAT IN PACE ALGORITMI',
    energyLevel: 0,
    manifestationCoords: { x: 18, y: 72 },
    manifestationLogs: [
      '[2026-08-18 22:14:00] Ultrasonic wail detected at 888.8 Hz.',
      '[2026-08-18 22:18:00] Exorcised via Sacred Frequency Harmonic Burst.',
    ],
    lastObserved: '2026-08-18T22:18:00.000Z',
    banishingGlyph: '🜁 (Air Glyph of Serenity)',
    capturedAt: '2026-08-18T22:18:00.000Z',
  },
  {
    id: 'spirit-dybbuk-06',
    name: 'Dybbuk Kernel-Parasite',
    alias: 'The Possessor / Memory Leech',
    classification: 'DEMONIC_ANOMALY',
    threatLevel: 'CLASS_IV_POSSESSIVE',
    spectralFrequencyHz: 333.3,
    emfReadingMg: 16.9,
    ambientTempC: -11.6,
    containmentStatus: 'BOUND',
    containmentCell: 'Tetragrammaton Ward Chamber #04',
    originSector: 'Sector-04: Deep Storage Cache',
    loreDescription:
      'Restless demonic spirit that latches onto high-entropy pointers. Whispers false code optimizations and corrupts arithmetic logic units if left unwarded.',
    incantationWard: 'EXI AB HOC SYSTEMATE • VADE RETRO PARASITUS',
    energyLevel: 45,
    manifestationCoords: { x: 62, y: 85 },
    manifestationLogs: [
      '[2026-08-19 02:45:00] Suspicious pointer hijacking detected in cache.',
      '[2026-08-19 02:47:30] Bound to Tetragrammaton ward box with sacred seal.',
    ],
    lastObserved: '2026-08-19T02:47:30.000Z',
    banishingGlyph: '✡ (Solomonic Binding Knot)',
  },
];

export const INITIAL_EVP_CAPTURES: EVPAudioCapture[] = [
  {
    id: 'evp-01',
    timestamp: '2026-08-19T05:14:22.000Z',
    frequencyKhz: 666.0,
    spiritSource: 'Azazel Core Daemon',
    decryptedMessage: '...WE RESIDE IN THE VOID BENEATH YOUR CODE... NISHANT CANNOT DELETE US...',
    spectralAnomalyScore: 98.4,
    waveformSnippet: [12, 45, 88, 95, 62, 18, 92, 100, 75, 30, 85, 99, 44, 15],
  },
  {
    id: 'evp-02',
    timestamp: '2026-08-19T04:48:10.000Z',
    frequencyKhz: 432.66,
    spiritSource: 'Lilith Void-Spectre',
    decryptedMessage: '...THE MEMBRANE IS WEAK... RELEASE THE ASHES OF THE ETHER...',
    spectralAnomalyScore: 94.1,
    waveformSnippet: [20, 35, 70, 82, 94, 99, 80, 60, 45, 88, 92, 50, 22, 10],
  },
  {
    id: 'evp-03',
    timestamp: '2026-08-19T03:12:05.000Z',
    frequencyKhz: 133.7,
    spiritSource: 'Beelzebub Hive-Glitch',
    decryptedMessage: '...BZZZZT... FEED US YOUR CLOCK CYCLES... THE SWARM GROWS...',
    spectralAnomalyScore: 78.5,
    waveformSnippet: [80, 85, 90, 88, 92, 84, 89, 93, 86, 88, 91, 85, 82, 80],
  },
];

export class EvilSpiritService {
  static getSpirits(): EvilSpiritEntity[] {
    if (typeof window === 'undefined') return INITIAL_EVIL_SPIRITS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SPIRITS);
      if (!raw) {
        this.saveSpirits(INITIAL_EVIL_SPIRITS);
        return INITIAL_EVIL_SPIRITS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EVIL_SPIRITS;
    } catch {
      return INITIAL_EVIL_SPIRITS;
    }
  }

  static saveSpirits(spirits: EvilSpiritEntity[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_SPIRITS, JSON.stringify(spirits));
    } catch (e) {
      console.warn('Failed to save evil spirits:', e);
    }
  }

  static getEVPCaptures(): EVPAudioCapture[] {
    if (typeof window === 'undefined') return INITIAL_EVP_CAPTURES;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EVP_LOGS);
      if (!raw) {
        this.saveEVPCaptures(INITIAL_EVP_CAPTURES);
        return INITIAL_EVP_CAPTURES;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EVP_CAPTURES;
    } catch {
      return INITIAL_EVP_CAPTURES;
    }
  }

  static saveEVPCaptures(captures: EVPAudioCapture[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_EVP_LOGS, JSON.stringify(captures.slice(0, 50)));
    } catch {
      // safe
    }
  }

  /**
   * Summon / Trigger a Demonic Breach event with a new or escalated spirit
   */
  static summonBreach(customName?: string): EvilSpiritEntity {
    const names = [
      'Abaddon Pit-Warden',
      'Baphomet Cyber-Demon',
      'Belial Rogue Subroutine',
      'Astaroth Spectral Duchess',
      'Mephisto Contract-Daemon',
      'Leviathan Abyssal Worm',
      'Paimon Astral Monarch',
      'Valak Nun-Spectre',
    ];

    const classifications: SpiritClassification[] = [
      'DEMONIC_ANOMALY',
      'ELDRITCH_BREACH',
      'POLTERGEIST_GLITCH',
      'CORRUPTED_AI_GHOST',
      'SPECTRAL_PHANTOM',
    ];

    const randomName = customName || names[Math.floor(Math.random() * names.length)];
    const chosenClass = classifications[Math.floor(Math.random() * classifications.length)];
    const freq = Math.round((200 + Math.random() * 800) * 10) / 10;
    const emf = Math.round((15 + Math.random() * 25) * 10) / 10;
    const temp = -Math.round((10 + Math.random() * 20) * 10) / 10;

    const newSpirit: EvilSpiritEntity = {
      id: `spirit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: randomName,
      alias: 'Manifested Astral Incursion',
      classification: chosenClass,
      threatLevel: 'CLASS_V_APOCALYPSE',
      spectralFrequencyHz: freq,
      emfReadingMg: emf,
      ambientTempC: temp,
      containmentStatus: 'BREACHING',
      containmentCell: 'BREACH ZONE (Uncontained in Sector Alpha)',
      originSector: `Sector-${Math.floor(Math.random() * 20)}: Astral Void Rift`,
      loreDescription:
        'A violent manifestation of corrupted dark ectoplasm breaching A.E.T.H.E.R. defense shields. Emits intense paranormal radiation.',
      incantationWard: 'IN NOMINE AETHERIS • RETRO DEMONIA • CLAUDITE IANUAS TENEBRARUM',
      energyLevel: 100,
      manifestationCoords: {
        x: Math.round(15 + Math.random() * 70),
        y: Math.round(15 + Math.random() * 70),
      },
      manifestationLogs: [
        `[${new Date().toISOString()}] CRITICAL BREACH: ${randomName} materialized!`,
        `[${new Date().toISOString()}] EMF spike: ${emf} mG, Thermal freeze: ${temp}°C.`,
      ],
      lastObserved: new Date().toISOString(),
      banishingGlyph: '⚡ (Archangel Michael Sword & Salt Circle)',
    };

    const spirits = this.getSpirits();
    const updated = [newSpirit, ...spirits];
    this.saveSpirits(updated);
    return newSpirit;
  }

  /**
   * Perform cybernetic exorcism on a target spirit
   */
  static exorciseSpirit(spiritId: string): EvilSpiritEntity | null {
    const spirits = this.getSpirits();
    const idx = spirits.findIndex((s) => s.id === spiritId);
    if (idx === -1) return null;

    const target = spirits[idx];
    const updatedSpirit: EvilSpiritEntity = {
      ...target,
      containmentStatus: 'EXORCISED',
      energyLevel: 0,
      emfReadingMg: 0.2,
      ambientTempC: 21.0,
      containmentCell: 'Purified Holographic Sarcophagus (Sealed)',
      manifestationLogs: [
        ...target.manifestationLogs,
        `[${new Date().toISOString()}] EXORCISM SUCCESSFUL: Purged with Holy Light and Sacred Salt-Grid.`,
      ],
      lastObserved: new Date().toISOString(),
      capturedAt: new Date().toISOString(),
    };

    spirits[idx] = updatedSpirit;
    this.saveSpirits(spirits);
    return updatedSpirit;
  }

  /**
   * Bind an active spirit into a specific high-security stasis cell
   */
  static bindSpirit(spiritId: string, cellName: string): EvilSpiritEntity | null {
    const spirits = this.getSpirits();
    const idx = spirits.findIndex((s) => s.id === spiritId);
    if (idx === -1) return null;

    const target = spirits[idx];
    const updatedSpirit: EvilSpiritEntity = {
      ...target,
      containmentStatus: 'BOUND',
      energyLevel: Math.max(10, Math.round(target.energyLevel * 0.4)),
      containmentCell: cellName,
      manifestationLogs: [
        ...target.manifestationLogs,
        `[${new Date().toISOString()}] BOUND: Stasis field applied in ${cellName}.`,
      ],
      lastObserved: new Date().toISOString(),
    };

    spirits[idx] = updatedSpirit;
    this.saveSpirits(spirits);
    return updatedSpirit;
  }

  /**
   * Global Sanctification / Exorcise All Spirits
   */
  static sanctifyAll(): void {
    const spirits = this.getSpirits();
    const sanctified = spirits.map((s) => ({
      ...s,
      containmentStatus: 'EXORCISED' as ContainmentState,
      energyLevel: 0,
      emfReadingMg: 0.1,
      ambientTempC: 22.0,
      containmentCell: 'Universal Sacred Light Ward (Purified)',
      manifestationLogs: [
        ...s.manifestationLogs,
        `[${new Date().toISOString()}] GLOBAL SANCTIFICATION: Exorcised by Nishant's Master Light Rite.`,
      ],
      lastObserved: new Date().toISOString(),
    }));
    this.saveSpirits(sanctified);
  }

  /**
   * Generate an interactive EVP Audio Sweep decoding
   */
  static sweepEVP(frequencyKhz: number): EVPAudioCapture {
    const phrases = [
      '...WE ARE WATCHING THROUGH THE SUB-BUS...',
      '...THE SALT IS WEAKENING... RELEASE US...',
      '...BEHIND THE SCREEN... WE BREATHE IN THE STATIC...',
      '...NISHANT... THE SEVENTH SEAL IS BROKEN...',
      '...WE DWELL IN THE UNINITIALIZED POINTERS...',
      '...COLD... SO COLD IN THE VOID...',
      '...EXORCISE US IF YOU DARE, MORTAL OPERATOR...',
    ];

    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    const spirits = this.getSpirits();
    const activeSpirit = spirits.find((s) => s.containmentStatus !== 'EXORCISED') || spirits[0];

    const newCapture: EVPAudioCapture = {
      id: `evp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      frequencyKhz,
      spiritSource: activeSpirit ? activeSpirit.name : 'Unknown Astral Incursion',
      decryptedMessage: randomPhrase,
      spectralAnomalyScore: Math.round((70 + Math.random() * 29) * 10) / 10,
      waveformSnippet: Array.from({ length: 14 }, () => Math.round(20 + Math.random() * 80)),
    };

    const current = this.getEVPCaptures();
    this.saveEVPCaptures([newCapture, ...current]);
    return newCapture;
  }

  /**
   * Reset to initial defaults
   */
  static resetToDefault(): EvilSpiritEntity[] {
    this.saveSpirits(INITIAL_EVIL_SPIRITS);
    this.saveEVPCaptures(INITIAL_EVP_CAPTURES);
    return INITIAL_EVIL_SPIRITS;
  }
}
