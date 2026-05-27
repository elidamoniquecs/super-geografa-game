import { useEffect, useRef, useState } from "react";
import { LEVELS, type Question } from "./questions";
import { getChiptune } from "./chiptune";
import { playEvilLaugh, playHappyChime } from "./sfx";
import raiPulaUrl from "@/assets/game/rai_pula.png";
import raiAndaUrl from "@/assets/game/rai_anda.png";
import fundoUrl from "@/assets/game/fundo.jpg";
import plataformaUrl from "@/assets/game/plataforma.png";
import logoUrl from "@/assets/game/logo.png";

// ---------- Types ----------
type Vec = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Platform = Rect;
type EnemyKind = "small" | "medium" | "large";
type EntityRole = "shadow" | "tree" | "organism";
type OrganismKind = "ant" | "beetle" | "sun" | "butterfly";
type Enemy = {
  id: number;
  kind: EnemyKind;
  role: EntityRole;
  organismKind?: OrganismKind;
  flying?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  baseY: number;
  range: [number, number];
  shootCooldown: number;
  dead: boolean;
  tamed?: boolean;
  stun?: number;
  questionIdx: number; // which question of the level this enemy holds
  asked: boolean;
  reaction: "none" | "happy" | "scary";
  reactionT: number;
};
type Bullet = { x: number; y: number; vx: number; vy: number; r: number };
type Beam = { x: number; y: number; vx: number; vy: number; r: number; life: number };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};

type LevelDef = {
  width: number;
  platforms: Platform[];
  enemies: (Omit<Enemy, "id" | "dead" | "asked" | "vx" | "vy" | "shootCooldown" | "baseY" | "range" | "reaction" | "reactionT" | "organismKind" | "flying"> & { organismKind?: OrganismKind; flying?: boolean })[];
  earthX: number;
  earthY: number;
};

// World constants
const VIEW_W = 960;
const VIEW_H = 540;
const GRAVITY = 0.85;
const MOVE_SPEED = 3.4;
const JUMP_V = -16;
const GROUND_H = 60;

// ---------- Level builder ----------
function buildLevels(): LevelDef[] {
  const mk = (w: number, plats: Platform[], enemies: LevelDef["enemies"]): LevelDef => ({
    width: w,
    platforms: plats,
    enemies,
    earthX: w - 120,
    earthY: VIEW_H - GROUND_H - 80,
  });

  // Each level: long scrollable world with ground, floating platforms, gaps,
  // and exactly 3 enemies that will deliver the 3 questions.
  const ground = (width: number): Platform[] => {
    // ground with a couple of gaps
    return [
      { x: 0, y: VIEW_H - GROUND_H, w: width * 0.28, h: GROUND_H },
      { x: width * 0.32, y: VIEW_H - GROUND_H, w: width * 0.22, h: GROUND_H },
      { x: width * 0.58, y: VIEW_H - GROUND_H, w: width * 0.18, h: GROUND_H },
      { x: width * 0.8, y: VIEW_H - GROUND_H, w: width * 0.2, h: GROUND_H },
    ];
  };

  // Helpers for entity placement
  const tree = (x: number, questionIdx: number): LevelDef["enemies"][number] => ({
    role: "tree",
    kind: "large",
    x,
    y: VIEW_H - GROUND_H - 88,
    w: 64,
    h: 88,
    questionIdx,
  });
  const shadowGround = (x: number, kind: EnemyKind = "small"): LevelDef["enemies"][number] => ({
    role: "shadow",
    kind,
    x,
    y: VIEW_H - GROUND_H - (kind === "large" ? 64 : 36),
    w: kind === "large" ? 64 : 36,
    h: kind === "large" ? 64 : 36,
    questionIdx: -1,
  });
  const shadowFly = (x: number, y: number): LevelDef["enemies"][number] => ({
    role: "shadow",
    kind: "medium",
    x,
    y,
    w: 44,
    h: 44,
    questionIdx: -1,
  });
  const organism = (x: number, kind: OrganismKind): LevelDef["enemies"][number] => ({
    role: "organism",
    kind: "small",
    organismKind: kind,
    x,
    y: VIEW_H - GROUND_H - 26,
    w: 28,
    h: 26,
    questionIdx: -1,
  });
  const beetleFly = (x: number, y: number): LevelDef["enemies"][number] => ({
    role: "organism",
    kind: "small",
    organismKind: "beetle",
    flying: true,
    x,
    y,
    w: 28,
    h: 22,
    questionIdx: -1,
  });
  const sunPickup = (x: number, y: number): LevelDef["enemies"][number] => ({
    role: "organism",
    kind: "small",
    organismKind: "sun",
    flying: true,
    x,
    y,
    w: 30,
    h: 30,
    questionIdx: -1,
  });
  const butterflyFly = (x: number, y: number): LevelDef["enemies"][number] => ({
    role: "organism",
    kind: "small",
    organismKind: "butterfly",
    flying: true,
    x,
    y,
    w: 44,
    h: 36,
    questionIdx: -1,
  });

  const L1: LevelDef = mk(
    3600,
    [
      ...ground(3600),
      { x: 420, y: 380, w: 160, h: 24 },
      { x: 680, y: 340, w: 140, h: 24 },
      { x: 900, y: 300, w: 160, h: 24 },
      { x: 1240, y: 360, w: 140, h: 24 },
      { x: 1750, y: 360, w: 180, h: 24 },
      { x: 2050, y: 320, w: 160, h: 24 },
      { x: 2300, y: 280, w: 140, h: 24 },
      { x: 3040, y: 260, w: 260, h: 24 },
      { x: 3200, y: 340, w: 200, h: 24 },
    ],
    [
      shadowGround(550, "small"),
      organism(300, "ant"),
      organism(820, "ant"),
      tree(1300, 0),
      shadowFly(1500, 260),
      beetleFly(1600, 200),
      shadowGround(1900, "small"),
      organism(2150, "ant"),
      tree(2350, 1),
      shadowGround(3050, "large"),
      organism(2850, "beetle"),
      beetleFly(3050, 180),
      tree(3300, 2),
      sunPickup(1350, 220),
      sunPickup(2450, 340),
      butterflyFly(2700, 360),
    ],
  );

  const L2: LevelDef = mk(
    4200,
    [
      ...ground(4200),
      { x: 350, y: 360, w: 140, h: 24 },
      { x: 600, y: 320, w: 140, h: 24 },
      { x: 850, y: 360, w: 140, h: 24 },
      
      { x: 1650, y: 360, w: 160, h: 24 },
      { x: 2250, y: 360, w: 160, h: 24 },
      { x: 2850, y: 360, w: 180, h: 24 },
      { x: 3450, y: 360, w: 180, h: 24 },
      { x: 3750, y: 370, w: 220, h: 24 },
    ],
    [
      shadowGround(500, "small"),
      organism(280, "ant"),
      shadowFly(900, 220),
      organism(1100, "ant"),
      beetleFly(1250, 200),
      tree(1400, 0),
      shadowGround(1800, "small"),
      shadowFly(2100, 240),
      organism(2350, "ant"),
      tree(2500, 1),
      shadowGround(2900, "large"),
      organism(3150, "beetle"),
      beetleFly(3300, 180),
      shadowGround(3400, "small"),
      organism(3650, "ant"),
      tree(3850, 2),
      sunPickup(750, 200),
      sunPickup(2000, 180),
      sunPickup(3250, 170),
      butterflyFly(2700, 300),
    ],
  );

  const L3: LevelDef = mk(
    6400,
    [
      ...ground(6400),
      { x: 300, y: 360, w: 120, h: 24 },
      { x: 520, y: 320, w: 120, h: 24 },
      { x: 960, y: 300, w: 120, h: 24 },
      { x: 1450, y: 300, w: 140, h: 24 },
      { x: 1800, y: 460, w: 280, h: 24 },
      { x: 2580, y: 320, w: 140, h: 24 },
      { x: 3180, y: 320, w: 160, h: 24 },
      { x: 3780, y: 320, w: 160, h: 24 },
      { x: 4400, y: 320, w: 140, h: 24 },
      { x: 5000, y: 320, w: 140, h: 24 },
      { x: 5600, y: 320, w: 160, h: 24 },
      { x: 5900, y: 340, w: 260, h: 24 },
      // Estreitar buraco antes da pergunta sobre horizonte "E" (árvore em 3780)
      { x: 3456, y: VIEW_H - GROUND_H, w: 180, h: GROUND_H },
      // Plataforma flutuante baixa para auxiliar a travessia depois da pergunta sobre Bt (árvore em 4600)
      { x: 4900, y: 430, w: 150, h: 24 },
    ],
    [
      shadowGround(450, "small"),
      organism(700, "ant"),
      tree(950, 0),
      shadowFly(1300, 220),
      beetleFly(1450, 180),
      shadowGround(1600, "small"),
      organism(1750, "ant"),
      tree(2300, 1),
      shadowGround(2200, "large"),
      organism(2450, "beetle"),
      tree(2750, 2),
      shadowFly(3100, 240),
      beetleFly(3250, 170),
      shadowGround(3400, "small"),
      organism(3550, "ant"),
      tree(3780, 3),
      shadowGround(4000, "large"),
      organism(4250, "ant"),
      beetleFly(4450, 200),
      tree(4600, 4),
      shadowFly(4950, 230),
      shadowGround(5250, "small"),
      organism(5400, "ant"),
      beetleFly(5550, 180),
      tree(5700, 5),
      sunPickup(550, 180),
      sunPickup(2050, 170),
      sunPickup(3300, 160),
      sunPickup(4750, 180),
      // Borboletas voando baixo — uma antes de cada sombra grande atiradora (2200 e 4000)
      butterflyFly(1920, 420),
      butterflyFly(3850, 420),
    ],
  );

  return [L1, L2, L3];
}

// ---------- Helpers ----------
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function overlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---------- Component ----------
export default function SoilGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [screen, setScreen] = useState<"menu" | "play" | "win" | "gameover" | "levelComplete">(
    "menu",
  );
  const [musicMuted, setMusicMuted] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [levelScores, setLevelScores] = useState<number[]>([0, 0, 0]);

  // Pontos máximos por pergunta em cada fase (descontados proporcionalmente ao tempo)
  const LEVEL_MAX_POINTS = [20, 30, 40];
  const QUESTION_TIME_MS = 60000;

  useEffect(() => {
    return () => { getChiptune().stop(); };
  }, []);
  useEffect(() => {
    getChiptune().setMuted(musicMuted);
  }, [musicMuted]);
  const [levelIdx, setLevelIdx] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<{
    enemyId: number;
    q: Question;
    timeLeft: number;
  } | null>(null);

  // refs for live game state (don't trigger rerenders each frame)
  const stateRef = useRef({
    player: {
      x: 60,
      y: 100,
      w: 38,
      h: 52,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1 as 1 | -1,
      walkAnim: 0,
      walkFrame: 0,
      invuln: 0,
      spawnX: 60,
      spawnY: 100,
      speedBoost: 0,
      bigMode: 0,
      sunPower: 0,
    },
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    beams: [] as Beam[],
    beamCooldown: 0,
    particles: [] as Particle[],
    camera: 0,
      keys: { left: false, right: false, jump: false, shoot: false },
    paused: false,
    level: buildLevels()[0],
    images: {} as Record<string, HTMLImageElement>,
    questionEnemyId: null as number | null,
    questionDeadline: 0,
    livesRef: 3,
    levelIdxRef: 0,
    scoreRef: 0,
  });

  // ---------- Init level ----------
  const initLevel = (idx: number, resetLives = false) => {
    const lv = buildLevels()[idx];
    const s = stateRef.current;
    s.level = lv;
    s.enemies = lv.enemies.map((e, i) => ({
      id: i + 1,
      kind: e.kind,
      role: e.role,
      organismKind: e.organismKind,
      flying: e.flying,
      x: e.x,
      y: e.y,
      w: e.w,
      h: e.h,
      vx:
        e.role === "shadow"
          ? e.kind === "small"
            ? -0.8
            : e.kind === "medium"
              ? 1.2
              : 1
          : 0,
      vy: 0,
      baseY: e.y,
      range: [e.x - 120, e.x + 120] as [number, number],
      shootCooldown: 60,
      dead: false,
      stun: 0,
      questionIdx: e.questionIdx,
      asked: false,
      reaction: "none" as const,
      reactionT: 0,
    }));
    s.bullets = [];
    s.beams = [];
    s.beamCooldown = 0;
    s.particles = [];
    (s as any)._levelDoneFired = false;
    s.camera = 0;
    s.player.x = 60;
    s.player.y = 100;
    s.player.vx = 0;
    s.player.vy = 0;
    s.player.spawnX = 60;
    s.player.spawnY = 100;
    s.player.invuln = 60;
    if (resetLives) {
      s.livesRef = 3;
      setLives(3);
      s.scoreRef = 0;
      setScore(0);
      setLevelScores([0, 0, 0]);
    }
    s.levelIdxRef = idx;
    setLevelIdx(idx);
    setCurrentQuestion(null);
    s.questionEnemyId = null;
    s.paused = false;
  };

  // ---------- Load images ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [pula, anda, fundo, plat, logo] = await Promise.all([
        loadImage(raiPulaUrl),
        loadImage(raiAndaUrl),
        loadImage(fundoUrl),
        loadImage(plataformaUrl),
        loadImage(logoUrl),
      ]);
      if (!mounted) return;
      stateRef.current.images = { pula, anda, fundo, plat, logo };
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------- Input ----------
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (screen !== "play") return;
      if (currentQuestion) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") stateRef.current.keys.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") stateRef.current.keys.right = true;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")
        stateRef.current.keys.jump = true;
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        stateRef.current.keys.shoot = true;
        // Double-tap down: shadow burst (kills nearby large shooter shadows)
        const st = stateRef.current as any;
        const now = performance.now();
        if (st._lastDownTap && now - st._lastDownTap < 320) {
          st._burstPending = true;
          st._lastDownTap = 0;
        } else {
          st._lastDownTap = now;
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") stateRef.current.keys.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") stateRef.current.keys.right = false;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")
        stateRef.current.keys.jump = false;
      if (e.code === "ArrowDown" || e.code === "KeyS")
        stateRef.current.keys.shoot = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [screen, currentQuestion]);

  // ---------- Game Loop ----------
  useEffect(() => {
    if (screen !== "play") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();

    const emitParticles = (x: number, y: number, color: "player" | "enemy") => {
      const s = stateRef.current;
      const colors =
        color === "player" ? ["#ff3b30", "#ff9500", "#ffcc00"] : ["#0a0a0a", "#1a1a1a", "#2a2a2a"];
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 3.5;
        s.particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 1.5,
          life: 50,
          max: 50,
          color: colors[i % colors.length],
          size: 2 + Math.random() * 3,
        });
      }
    };

    const loseLife = () => {
      const s = stateRef.current;
      if (s.player.invuln > 0) return;
      emitParticles(s.player.x + s.player.w / 2, s.player.y + s.player.h / 2, "player");
      s.livesRef -= 1;
      setLives(s.livesRef);
      if (s.livesRef <= 0) {
        setScreen("gameover");
        return;
      }
      // respawn at same spot (current x), reset velocity
      s.player.y = s.player.spawnY;
      s.player.vx = 0;
      s.player.vy = 0;
      s.player.invuln = 90;
    };

    const triggerQuestion = (enemy: Enemy) => {
      const s = stateRef.current;
      if (enemy.asked || enemy.dead) return;
      enemy.asked = true;
      s.paused = true;
      s.questionEnemyId = enemy.id;
      const q = LEVELS[s.levelIdxRef][enemy.questionIdx];
      s.questionDeadline = performance.now() + 60000;
      setCurrentQuestion({ enemyId: enemy.id, q, timeLeft: 60 });
    };

    const step = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      const s = stateRef.current;
      const lv = s.level;

      // Question countdown
      if (s.paused && s.questionEnemyId !== null) {
        const remaining = Math.max(0, Math.ceil((s.questionDeadline - now) / 1000));
        setCurrentQuestion((cq) => (cq ? { ...cq, timeLeft: remaining } : cq));
        if (remaining <= 0) {
          // timeout = lose life
          s.paused = false;
          s.questionEnemyId = null;
          setCurrentQuestion(null);
          // reset all asked flag for that enemy so it remains alive but pushes player back
          loseLife();
        }
        // still render
      } else {
        // physics
        const p = s.player;
        const speedMul = p.speedBoost > 0 ? 1.55 : 1;
        if (s.keys.left) {
          p.vx = -MOVE_SPEED * speedMul;
          p.facing = -1;
        } else if (s.keys.right) {
          p.vx = MOVE_SPEED * speedMul;
          p.facing = 1;
        } else p.vx = 0;
        if (p.speedBoost > 0) p.speedBoost--;
        if (p.bigMode > 0) p.bigMode--;
        if (p.sunPower > 0) p.sunPower--;
        if (s.keys.jump && p.onGround) {
          p.vy = JUMP_V;
          p.onGround = false;
        }
        // Fire solar beam (ArrowDown) — requires sun power pickup
        if (s.beamCooldown > 0) s.beamCooldown--;
        if (s.keys.shoot && s.beamCooldown <= 0 && p.sunPower > 0) {
          s.beamCooldown = 24;
          const dir = p.facing;
          s.beams.push({
            x: p.x + p.w / 2 + dir * 18,
            y: p.y + p.h * 0.45,
            vx: dir * 9,
            vy: 0,
            r: 8,
            life: 70,
          });
        }
        // Shadow burst: double-tap down kills nearby large shooter shadows
        const stAny = s as any;
        if (stAny._burstPending) {
          stAny._burstPending = false;
          const pcx = p.x + p.w / 2;
          const pcy = p.y + p.h / 2;
          for (const e of s.enemies) {
            if (e.dead || e.role !== "shadow" || e.kind !== "large") continue;
            const ecx = e.x + e.w / 2;
            const ecy = e.y + e.h / 2;
            const dx = ecx - pcx;
            const dy = ecy - pcy;
            if (Math.hypot(dx, dy) <= 220) {
              e.dead = true;
              // clear its bullets
              for (const b of s.bullets) {
                if (Math.hypot(b.x - ecx, b.y - ecy) < 260) b.x = -9999;
              }
              const colors = ["#fff59d", "#ffd54f", "#ffb300", "#fff", "#ffeb3b"];
              for (let i = 0; i < 26; i++) {
                const a = Math.random() * Math.PI * 2;
                const sp = 1.5 + Math.random() * 3.5;
                s.particles.push({
                  x: ecx,
                  y: ecy,
                  vx: Math.cos(a) * sp,
                  vy: Math.sin(a) * sp - 1.2,
                  life: 60, max: 60,
                  color: colors[i % colors.length], size: 3,
                });
              }
            }
          }
        }
        p.vy += GRAVITY;
        if (p.vy > 14) p.vy = 14;
        // variable jump height: cut velocity if jump released
        if (!s.keys.jump && p.vy < -6) p.vy = -6;

        // walk anim
        if (p.vx !== 0 && p.onGround) {
          p.walkAnim += dt;
          if (p.walkAnim > 200) {
            p.walkAnim = 0;
            p.walkFrame = 1 - p.walkFrame;
          }
        } else p.walkFrame = 0;

        // horizontal
        p.x += p.vx;
        if (p.x < 0) p.x = 0;
        if (p.x + p.w > lv.width) p.x = lv.width - p.w;
        // horizontal collision with platforms
        for (const pl of lv.platforms) {
          const r = { x: p.x, y: p.y, w: p.w, h: p.h };
          if (overlap(r, pl)) {
            if (p.vx > 0) p.x = pl.x - p.w;
            else if (p.vx < 0) p.x = pl.x + pl.w;
          }
        }
        // vertical
        p.y += p.vy;
        p.onGround = false;
        for (const pl of lv.platforms) {
          const r = { x: p.x, y: p.y, w: p.w, h: p.h };
          if (overlap(r, pl)) {
            if (p.vy > 0) {
              p.y = pl.y - p.h;
              p.vy = 0;
              p.onGround = true;
              p.spawnY = p.y;
            } else if (p.vy < 0) {
              p.y = pl.y + pl.h;
              p.vy = 0;
            }
          }
        }
        // fell off
        if (p.y > VIEW_H + 200) {
          loseLife();
        }
        if (p.invuln > 0) p.invuln--;

        // camera follows
        s.camera = Math.max(0, Math.min(lv.width - VIEW_W, p.x - VIEW_W * 0.4));

        // enemies
        for (const e of s.enemies) {
          if (e.dead) continue;
        // Reaction animation (after answer) — freeze enemy, count down, then resolve.
        if (e.reaction !== "none") {
          e.reactionT -= 1;
          if (e.reactionT <= 0) {
            if (e.reaction === "happy") {
              e.dead = true;
            } else {
              // scary -> shrink back to normal and let it be asked again
              e.asked = false;
            }
            e.reaction = "none";
          }
          continue;
        }
          // floating beetles hover in place
          if (e.role === "organism" && e.flying) {
            // floating beetle hovers in place
            e.y = e.baseY + Math.sin(now / 350 + e.x) * 14;
          }
          if (e.role === "shadow" && !e.tamed) {
            if (e.stun && e.stun > 0) {
              e.stun -= 1;
              // stunned: skip movement and shooting this frame
            } else
            if (e.kind === "small") {
              e.x += e.vx;
              if (e.x < e.range[0] || e.x > e.range[1]) e.vx *= -1;
            } else if (e.kind === "medium") {
              e.x += e.vx;
              e.y = e.baseY + Math.sin(now / 400) * 30;
              if (e.x < e.range[0] || e.x > e.range[1]) e.vx *= -1;
            } else {
              // large: shoot alternating left/right (horizontal, predictable)
              e.shootCooldown -= 1;
              if (e.shootCooldown <= 0) {
                e.shootCooldown = 160;
                const dir = e.vx >= 0 ? 1 : -1;
                s.bullets.push({
                  x: e.x + e.w / 2,
                  y: e.y + e.h / 2,
                  vx: dir * 3,
                  vy: 0,
                  r: 7,
                });
                e.vx = -dir; // flip for next shot
              }
            }
          }
          // collision with player
          const pr = { x: p.x, y: p.y, w: p.w, h: p.h };
          const er = { x: e.x, y: e.y, w: e.w, h: e.h };
          if (!overlap(pr, er)) continue;

          if (e.role === "tree") {
            // Trigger question on contact (only if not already asked/dead)
            triggerQuestion(e);
            break;
          } else if (e.role === "organism") {
            // Pickup powerup
            e.dead = true;
            playHappyChime();
            const kind = e.organismKind;
            if (kind === "ant") {
              p.speedBoost = Math.max(p.speedBoost, 60 * 8); // 8s faster
              s.livesRef = Math.min(9, s.livesRef + 1);
              setLives(s.livesRef);
            } else if (kind === "beetle") {
              p.bigMode = Math.max(p.bigMode, 60 * 8); // 8s "big" (invuln to shadows)
              s.livesRef = Math.min(9, s.livesRef + 1);
              setLives(s.livesRef);
            } else if (kind === "butterfly") {
              p.bigMode = Math.max(p.bigMode, 60 * 12); // 12s "grande" — pode pisar sombras grandes
            } else {
              p.sunPower = Math.max(p.sunPower, 60 * 8); // 8s of solar beams
            }
            const colors =
              kind === "ant"
                ? ["#a1887f", "#6d4c41", "#ffeb3b"]
                : kind === "beetle"
                  ? ["#e53935", "#ff7043", "#fff"]
                  : kind === "butterfly"
                    ? ["#ff80ab", "#ce93d8", "#fff59d", "#80deea"]
                    : ["#fff59d", "#ffd54f", "#ffb300", "#fff"];
            for (let i = 0; i < 18; i++) {
              const a = Math.random() * Math.PI * 2;
              const sp = 1 + Math.random() * 2.5;
              s.particles.push({
                x: e.x + e.w / 2,
                y: e.y + e.h / 2,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 1.5,
                life: 50, max: 50,
                color: colors[i % colors.length], size: 3,
              });
            }
          } else {
            // shadow obstacle
            if (e.tamed) {
              // sombra iluminada — inofensiva
              continue;
            }
            const tameSmallMedium = () => {
              e.tamed = true;
              e.vx = 0;
              e.stun = 0;
              s.scoreRef += 10;
              setScore(s.scoreRef);
              playHappyChime();
              for (let i = 0; i < 18; i++) {
                const a = Math.random() * Math.PI * 2;
                const sp = 1 + Math.random() * 2.5;
                s.particles.push({
                  x: e.x + e.w / 2,
                  y: e.y + e.h / 2,
                  vx: Math.cos(a) * sp,
                  vy: Math.sin(a) * sp - 1.5,
                  life: 50, max: 50,
                  color: ["#fff59d", "#ffd54f", "#ffb300", "#fff"][i % 4], size: 3,
                });
              }
            };
            const tameLarge = () => {
              e.tamed = true;
              e.vx = 0;
              e.stun = 0;
              s.scoreRef += 30;
              setScore(s.scoreRef);
              playHappyChime();
              // limpar tiros próximos
              const ecx = e.x + e.w / 2;
              const ecy = e.y + e.h / 2;
              for (const b of s.bullets) {
                if (Math.hypot(b.x - ecx, b.y - ecy) < 260) b.x = -9999;
              }
              const cols = ["#fff59d", "#ffd54f", "#ffb300", "#fff", "#ffeb3b"];
              for (let i = 0; i < 26; i++) {
                const a = Math.random() * Math.PI * 2;
                const sp = 1.5 + Math.random() * 3.5;
                s.particles.push({
                  x: ecx, y: ecy,
                  vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2,
                  life: 60, max: 60,
                  color: cols[i % cols.length], size: 3,
                });
              }
            };
            // stomp (cair em cima) — sombras pequenas/médias
            if ((e.kind === "small" || e.kind === "medium") && p.vy > 0 && p.y + p.h - 10 < e.y + 10) {
              tameSmallMedium();
              p.vy = JUMP_V * 0.7;
            }
            // head-bump (pular de baixo) em sombra voadora média
            else if (e.kind === "medium" && p.vy < 0 && p.y + 10 > e.y + e.h - 10) {
              tameSmallMedium();
              p.vy = Math.abs(p.vy) * 0.4; // quica para baixo
            }
            // big mode: encostar na sombra grande atiradora já destrói (poder acaba)
            else if (p.bigMode > 0 && e.kind === "large") {
              tameLarge();
              p.bigMode = 0; // consome o poder da borboleta
              if (p.vy > 0 && p.y + p.h - 10 < e.y + 16) p.vy = JUMP_V * 0.8;
              else p.x -= p.facing * 14;
            }
            else if (p.bigMode > 0) {
              // big mode: knockback shadow, no damage
              p.x -= p.facing * 18;
              p.invuln = 30;
            } else {
              p.x -= p.facing * 22;
              loseLife();
              break;
            }
          }
        }


        // bullets
        for (const b of s.bullets) {
          b.x += b.vx;
          b.y += b.vy;
        }
        s.bullets = s.bullets.filter(
          (b) => b.x > s.camera - 50 && b.x < s.camera + VIEW_W + 50 && b.y < VIEW_H + 50 && b.y > -50,
        );
        for (const b of s.bullets) {
          const br = { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 };
          if (overlap(br, { x: p.x, y: p.y, w: p.w, h: p.h })) {
            if (p.bigMode <= 0) loseLife();
            b.x = -9999;
          }
        }

        // solar beams (player projectiles)
        for (const bm of s.beams) {
          bm.x += bm.vx;
          bm.y += bm.vy;
          bm.life -= 1;
        }
        s.beams = s.beams.filter(
          (bm) => bm.life > 0 && bm.x > s.camera - 80 && bm.x < s.camera + VIEW_W + 80,
        );
        for (const bm of s.beams) {
          const bmr = { x: bm.x - bm.r, y: bm.y - bm.r, w: bm.r * 2, h: bm.r * 2 };
          // destroy enemy shadow bullets
          for (const b of s.bullets) {
            if (overlap(bmr, { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 })) {
              b.x = -9999;
              bm.life = 0;
            }
          }
          // hit shadows
          for (const e of s.enemies) {
            if (e.dead || e.role !== "shadow") continue;
            if (overlap(bmr, { x: e.x, y: e.y, w: e.w, h: e.h })) {
              // Beam stuns the shadow (stops shooting & moving) but does not kill it.
              e.stun = Math.max(e.stun ?? 0, 60 * 3);
              e.shootCooldown = Math.max(e.shootCooldown, 160);
              // golden sparkles
              const colors = ["#fff59d", "#ffd54f", "#ffb300", "#fff"];
              for (let i = 0; i < 14; i++) {
                const a = Math.random() * Math.PI * 2;
                const sp = 1 + Math.random() * 2.5;
                s.particles.push({
                  x: e.x + e.w / 2,
                  y: e.y + e.h / 2,
                  vx: Math.cos(a) * sp,
                  vy: Math.sin(a) * sp - 1,
                  life: 50, max: 50,
                  color: colors[i % colors.length], size: 3,
                });
              }
              bm.life = 0;
              break;
            }
          }
        }

        // Level complete: 3 perguntas respondidas corretamente (todas as árvores curadas).
        // Coletar sol/formigas/besouros e tocar a Terra são opcionais.
        const allAnswered = s.enemies.filter((e) => e.role === "tree").every((e) => e.dead);
        const earth = { x: lv.earthX, y: lv.earthY, w: 48, h: 48 };
        const touchedEarth = overlap({ x: p.x, y: p.y, w: p.w, h: p.h }, earth);
        if (allAnswered && (touchedEarth || !(s as any)._levelDoneFired)) {
          (s as any)._levelDoneFired = true;
          const currentIdx = s.levelIdxRef;
          setLevelScores((prev) => {
            const next = [...prev];
            next[currentIdx] = s.scoreRef;
            return next;
          });
          if (currentIdx >= 2) {
            setScreen("win");
          } else {
            setScreen("levelComplete");
          }
        }

        // particles
        for (const pt of s.particles) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.2;
          pt.life -= 1;
        }
        s.particles = s.particles.filter((pt) => pt.life > 0);
      }

      // ---------- Render ----------
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      const imgs = s.images;
      // background (parallax)
      if (imgs.fundo) {
        const bw = imgs.fundo.width;
        const bh = imgs.fundo.height;
        const scale = VIEW_H / bh;
        const tileW = bw * scale;
        const offset = -(s.camera * 0.4) % tileW;
        for (let x = offset - tileW; x < VIEW_W + tileW; x += tileW) {
          ctx.drawImage(imgs.fundo, x, 0, tileW, VIEW_H);
        }
      } else {
        ctx.fillStyle = "#87ceeb";
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }

      ctx.save();
      ctx.translate(-s.camera, 0);
      ctx.imageSmoothingEnabled = false;

      // platforms (tiled with original texture size)
      if (imgs.plat) {
        const tw = imgs.plat.width;
        const th = imgs.plat.height;
        for (const pl of s.level.platforms) {
          // clip to platform area
          ctx.save();
          ctx.beginPath();
          ctx.rect(pl.x, pl.y, pl.w, pl.h);
          ctx.clip();
          for (let xx = pl.x; xx < pl.x + pl.w; xx += tw) {
            for (let yy = pl.y; yy < pl.y + pl.h; yy += th) {
              ctx.drawImage(imgs.plat, xx, yy);
            }
          }
          ctx.restore();
        }
      }

      // earth goal
      const earthCx = s.level.earthX + 24;
      const earthCy = s.level.earthY + 24;
      ctx.save();
      ctx.translate(earthCx, earthCy + Math.sin(now / 300) * 4);
      ctx.fillStyle = "#1e88e5";
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#43a047";
      ctx.beginPath();
      ctx.ellipse(-8, -4, 10, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(8, 6, 9, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(2, -10, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // enemies
      for (const e of s.enemies) {
        if (e.dead) continue;
        if (e.role === "tree") {
          drawTree(ctx, e, now);
          continue;
        }
        if (e.role === "organism") {
          drawOrganism(ctx, e, now);
          continue;
        }
        // shadow
        const reacting = false;
        const scale = 1;
        const shakeX = 0;
        const stunned = (e.stun ?? 0) > 0;
        const bodyColor = e.tamed ? "#fff176" : stunned ? "#5d4037" : "#0a0a0a";
        const dw = e.w * scale;
        const dh = e.h * scale;
        const dx0 = e.x + e.w / 2 - dw / 2 + shakeX;
        const dy0 = e.y + e.h - dh; // anchor at feet
        ctx.fillStyle = bodyColor;
        if (e.kind === "medium") {
          // wings
          ctx.beginPath();
          ctx.ellipse(dx0 - 6 * scale, dy0 + dh / 2, 10 * scale, 6 * scale, 0, 0, Math.PI * 2);
          ctx.ellipse(dx0 + dw + 6 * scale, dy0 + dh / 2, 10 * scale, 6 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // body (rounded square pixel-art style)
        ctx.beginPath();
        const r = 6 * scale;
        const x = dx0,
          y = dy0,
          w = dw,
          h = dh;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
        // eyes
        ctx.fillStyle = "#fff";
        const eyeY = dy0 + dh * 0.35;
        const eyeR = Math.max(3, dw * 0.09);
        ctx.beginPath();
        ctx.arc(dx0 + dw * 0.32, eyeY, eyeR, 0, Math.PI * 2);
        ctx.arc(dx0 + dw * 0.68, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = e.tamed ? "#5d4037" : "#e53935";
        ctx.beginPath();
        ctx.arc(dx0 + dw * 0.32, eyeY, eyeR * 0.45, 0, Math.PI * 2);
        ctx.arc(dx0 + dw * 0.68, eyeY, eyeR * 0.45, 0, Math.PI * 2);
        ctx.fill();
        if (e.tamed) {
          // sorriso feliz
          ctx.strokeStyle = "#5d4037";
          ctx.lineWidth = Math.max(2, dw * 0.06);
          ctx.beginPath();
          ctx.arc(dx0 + dw * 0.5, dy0 + dh * 0.6, dw * 0.22, 0.1 * Math.PI, 0.9 * Math.PI);
          ctx.stroke();
          // brilho amarelo ao redor
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = "#fff59d";
          ctx.beginPath();
          ctx.arc(dx0 + dw / 2, dy0 + dh / 2, dw * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // bullets
      ctx.fillStyle = "#0a0a0a";
      for (const b of s.bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // solar beams (player projectiles)
      for (const bm of s.beams) {
        ctx.save();
        const grad = ctx.createRadialGradient(bm.x, bm.y, 2, bm.x, bm.y, bm.r * 2.2);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.35, "#fff176");
        grad.addColorStop(0.7, "#ffb300");
        grad.addColorStop(1, "rgba(255,179,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bm.x, bm.y, bm.r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        // streaks
        ctx.strokeStyle = "rgba(255,235,120,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        const dir = bm.vx >= 0 ? -1 : 1;
        ctx.moveTo(bm.x + dir * bm.r, bm.y);
        ctx.lineTo(bm.x + dir * bm.r * 4, bm.y);
        ctx.stroke();
        ctx.restore();
      }

      // player
      const p = s.player;
      const playerImg =
        p.onGround && p.vx !== 0
          ? p.walkFrame === 0
            ? imgs.pula
            : imgs.anda
          : imgs.pula;
      if (playerImg) {
        ctx.save();
        const blink = p.invuln > 0 && Math.floor(p.invuln / 6) % 2 === 0;
        if (blink) ctx.globalAlpha = 0.4;
        const bigScale = p.bigMode > 0 ? 1.35 : 1;
        const dw = p.w * bigScale;
        const dh = p.h * bigScale;
        const dxBase = p.x + p.w / 2 - dw / 2;
        const dyBase = p.y + p.h - dh; // feet anchored
        if (p.bigMode > 0) {
          // golden aura
          ctx.save();
          ctx.globalAlpha = 0.35 + Math.sin(now / 120) * 0.1;
          ctx.fillStyle = "#ffd54f";
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w * 1.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        if (p.facing === -1) {
          ctx.translate(dxBase + dw, dyBase);
          ctx.scale(-1, 1);
          ctx.drawImage(playerImg, 0, 0, dw, dh);
        } else {
          ctx.drawImage(playerImg, dxBase, dyBase, dw, dh);
        }
        ctx.restore();
      }

      // particles
      for (const pt of s.particles) {
        ctx.globalAlpha = pt.life / pt.max;
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      }
      ctx.globalAlpha = 1;

      ctx.restore();

      // HUD: hearts
      for (let i = 0; i < 3; i++) {
        drawHeart(ctx, 16 + i * 36, 16, i < s.livesRef);
      }
      // level label
      {
        const remaining = s.enemies.filter((e) => e.role === "tree" && !e.dead).length;
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(VIEW_W - 240, 10, 226, 112);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Fase ${s.levelIdxRef + 1} / 3`, VIEW_W - 228, 36);
        ctx.font = "bold 16px system-ui, sans-serif";
        ctx.fillStyle = "#ffe14a";
        ctx.fillText(`Árvores restantes: ${remaining}`, VIEW_W - 228, 62);
        ctx.fillStyle = "#9ef58d";
        ctx.fillText(`Pontos: ${s.scoreRef}`, VIEW_W - 228, 86);
        // Powerup indicator
        {
          const labels: string[] = [];
          if (p.sunPower > 0) labels.push(`☀️ Raios: ${Math.ceil(p.sunPower / 60)}s`);
          if (p.bigMode > 0) labels.push(`🪲 Forte: ${Math.ceil(p.bigMode / 60)}s`);
          if (p.speedBoost > 0) labels.push(`🐜 Rápida: ${Math.ceil(p.speedBoost / 60)}s`);
          if (labels.length) {
            ctx.fillStyle = "#ffd54f";
            ctx.fillText(labels.join("  "), VIEW_W - 228, 110);
          }
        }
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  // ---------- Heart drawing ----------
  function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, filled: boolean) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(14, 6);
    ctx.bezierCurveTo(14, 0, 4, 0, 4, 8);
    ctx.bezierCurveTo(4, 16, 14, 22, 14, 26);
    ctx.bezierCurveTo(14, 22, 24, 16, 24, 8);
    ctx.bezierCurveTo(24, 0, 14, 0, 14, 6);
    ctx.closePath();
    if (filled) {
      ctx.fillStyle = "#7ec8ff";
      ctx.fill();
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1976d2";
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Tree drawing ----------
  function drawTree(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
    const reacting = e.reaction !== "none";
    const happy = reacting && e.reaction === "happy";
    const withered = reacting && e.reaction === "scary";
    const cx = e.x + e.w / 2;
    const baseY = e.y + e.h;
    // trunk
    ctx.fillStyle = withered ? "#5d4037" : "#6d4c41";
    const trunkW = 14;
    const trunkH = e.h * 0.45;
    ctx.fillRect(cx - trunkW / 2, baseY - trunkH, trunkW, trunkH);
    // canopy
    const canopyY = baseY - trunkH - 6;
    if (withered) {
      // dead branches
      ctx.strokeStyle = "#4e342e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, canopyY);
      ctx.lineTo(cx - 14, canopyY - 16);
      ctx.moveTo(cx, canopyY);
      ctx.lineTo(cx + 14, canopyY - 14);
      ctx.moveTo(cx, canopyY);
      ctx.lineTo(cx, canopyY - 22);
      ctx.stroke();
      // few falling leaves
      ctx.fillStyle = "#8d6e63";
      ctx.beginPath();
      ctx.arc(cx - 10, canopyY + 6, 3, 0, Math.PI * 2);
      ctx.arc(cx + 8, canopyY + 10, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const grow = happy ? 1.25 + Math.sin(now / 180) * 0.04 : 1;
      const r = 24 * grow;
      // glow if happy
      if (happy) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#fff59d";
        ctx.beginPath();
        ctx.arc(cx, canopyY - r * 0.3, r * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = happy ? "#2e7d32" : "#388e3c";
      ctx.beginPath();
      ctx.arc(cx, canopyY - r * 0.3, r, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.7, canopyY - r * 0.1, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.7, canopyY - r * 0.1, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx, canopyY - r * 0.9, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      if (happy) {
        // fruits
        ctx.fillStyle = "#e53935";
        const fruits: [number, number][] = [
          [-10, 4], [12, -2], [0, -10], [-6, -14], [8, 8],
        ];
        for (const [fx, fy] of fruits) {
          ctx.beginPath();
          ctx.arc(cx + fx, canopyY - r * 0.3 + fy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // ---------- Organism drawing ----------
  function drawOrganism(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2 + Math.sin(now / 200 + e.x) * 2;
    if (e.organismKind === "butterfly") {
      // grande borboleta colorida com asas a bater
      const flap = Math.abs(Math.sin(now / 90));
      const wingW = 16 + flap * 6;
      const wingH = 14;
      // glow
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#ff80ab";
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // asas
      const wingGrad = ctx.createLinearGradient(cx - 20, cy - 10, cx + 20, cy + 10);
      wingGrad.addColorStop(0, "#ff4081");
      wingGrad.addColorStop(0.5, "#ce93d8");
      wingGrad.addColorStop(1, "#80deea");
      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy - 4, wingW, wingH, -0.3, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, cy - 4, wingW, wingH, 0.3, 0, Math.PI * 2);
      ctx.ellipse(cx - 8, cy + 6, wingW * 0.7, wingH * 0.7, 0.2, 0, Math.PI * 2);
      ctx.ellipse(cx + 8, cy + 6, wingW * 0.7, wingH * 0.7, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // pontinhos brancos nas asas
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx - 12, cy - 4, 2, 0, Math.PI * 2);
      ctx.arc(cx + 12, cy - 4, 2, 0, Math.PI * 2);
      ctx.fill();
      // corpo
      ctx.fillStyle = "#311b92";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 2.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // antenas
      ctx.strokeStyle = "#311b92";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 1, cy - 8);
      ctx.lineTo(cx - 4, cy - 13);
      ctx.moveTo(cx + 1, cy - 8);
      ctx.lineTo(cx + 4, cy - 13);
      ctx.stroke();
      return;
    }
    if (e.organismKind === "sun") {
      // glowing sun pickup
      ctx.save();
      const pulse = 1 + Math.sin(now / 220) * 0.08;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22 * pulse);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.35, "#fff176");
      grad.addColorStop(0.75, "#ffb300");
      grad.addColorStop(1, "rgba(255,179,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * pulse, 0, Math.PI * 2);
      ctx.fill();
      // core
      ctx.fillStyle = "#fff59d";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      // rays
      ctx.strokeStyle = "#ffb300";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + now / 600;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * 11, cy + Math.sin(ang) * 11);
        ctx.lineTo(cx + Math.cos(ang) * 16, cy + Math.sin(ang) * 16);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (e.organismKind === "ant") {
      // ant: 3 segments
      ctx.fillStyle = "#3e2723";
      ctx.beginPath();
      ctx.arc(cx - 8, cy, 5, 0, Math.PI * 2);
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      // antennae
      ctx.strokeStyle = "#3e2723";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy - 3);
      ctx.lineTo(cx + 12, cy - 8);
      ctx.moveTo(cx + 8, cy - 3);
      ctx.lineTo(cx + 14, cy - 5);
      ctx.stroke();
    } else {
      // beetle: red dome with black dots
      if (e.flying) {
        // shimmer wings
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#ffe082";
        const flap = Math.sin(now / 60) * 3;
        ctx.beginPath();
        ctx.ellipse(cx - 10, cy - 6 + flap, 8, 4, -0.4, 0, Math.PI * 2);
        ctx.ellipse(cx + 10, cy - 6 + flap, 8, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = "#c62828";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(cx - 4, cy - 1, 2, 0, Math.PI * 2);
      ctx.arc(cx + 4, cy + 1, 2, 0, Math.PI * 2);
      ctx.arc(cx, cy - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // line down middle
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 9);
      ctx.lineTo(cx, cy + 9);
      ctx.stroke();
    }
  }

  // ---------- Question answer handler ----------
  const answerQuestion = (idx: number) => {
    const s = stateRef.current;
    const enemyId = s.questionEnemyId;
    if (enemyId === null || !currentQuestion) return;
    const correct = currentQuestion.q.correct;
    s.paused = false;
    s.questionEnemyId = null;
    setCurrentQuestion(null);

    const enemy = s.enemies.find((e) => e.id === enemyId);
    if (idx === correct) {
      // Pontuação: máximo da fase × (tempo restante / tempo total)
      const remainingMs = Math.max(0, s.questionDeadline - performance.now());
      const maxPts = LEVEL_MAX_POINTS[s.levelIdxRef] ?? 20;
      const earned = Math.max(1, Math.round(maxPts * (remainingMs / QUESTION_TIME_MS)));
      s.scoreRef += earned;
      setScore(s.scoreRef);
      // Right answer: shadow turns sunny-yellow and happy, plays chime,
      // then disappears in particles.
      playHappyChime();
      if (enemy) {
        enemy.reaction = "happy";
        enemy.reactionT = 110; // ~1.8s — show fruited tree
        // green/fruit sparkles during the reaction
        const colors = ["#66bb6a", "#a5d6a7", "#e53935", "#ffeb3b"];
        for (let i = 0; i < 20; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 1 + Math.random() * 2.5;
          s.particles.push({
            x: enemy.x + enemy.w / 2,
            y: enemy.y + enemy.h / 2,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 1.5,
            life: 60,
            max: 60,
            color: colors[i % colors.length],
            size: 3,
          });
        }
      }
      // push player back a bit so doesn't re-collide
      s.player.x -= s.player.facing * 30;
      s.player.invuln = 100;
    } else {
      // Wrong answer: tree withers/loses leaves with evil laugh and player loses a life.
      playEvilLaugh();
      if (enemy) {
        enemy.reaction = "scary";
        enemy.reactionT = 130; // ~2.2s — wither
        // brown/leaf-falling particles
        const leafColors = ["#8d6e63", "#a1887f", "#bf6f3b"];
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 1 + Math.random() * 2;
          s.particles.push({
            x: enemy.x + enemy.w / 2,
            y: enemy.y + enemy.h / 2,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 0.5,
            life: 70, max: 70,
            color: leafColors[i % leafColors.length], size: 3,
          });
        }
      }
      s.player.x -= s.player.facing * 50;
      // lose a life
      s.player.invuln = 0;
      s.livesRef -= 1;
      setLives(s.livesRef);
      const colors = ["#ff3b30", "#ff9500", "#ffcc00"];
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 3;
        s.particles.push({
          x: s.player.x + s.player.w / 2,
          y: s.player.y + s.player.h / 2,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 1,
          life: 50,
          max: 50,
          color: colors[i % colors.length],
          size: 3,
        });
      }
      if (s.livesRef <= 0) {
        setScreen("gameover");
        return;
      }
      s.player.invuln = 130;
    }
  };

  // ---------- Mobile control handlers ----------
  const touchBtn = (key: "left" | "right" | "jump" | "shoot", down: boolean) => {
    stateRef.current.keys[key] = down;
  };

  // ---------- Render ----------
  return (
    <div
      ref={wrapRef}
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black"
    >
      <div
        className="relative"
        style={{
          width: "min(100vw, calc(100vh * 16 / 9))",
          height: "min(100vh, calc(100vw * 9 / 16))",
          maxWidth: "100vw",
        }}
      >
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="h-full w-full"
          style={{ imageRendering: "pixelated", display: "block" }}
        />

        <button
          type="button"
          onClick={() => setMusicMuted((m) => !m)}
          className="absolute right-3 top-3 z-30 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
          aria-label={musicMuted ? "Ativar música" : "Silenciar música"}
        >
          {musicMuted ? "🔇" : "🔊"}
        </button>

        {/* Menu */}
        {screen === "menu" && (
          <Overlay>
            <img src={logoUrl} alt="Princesa Rai" className="mb-6 w-[min(70vw,520px)]" />
            <p className="mb-6 max-w-md text-center text-base text-white/90">
              Ajude a Geógrafa a salvar a Terra respondendo perguntas sobre os solos!
            </p>
            <MenuBtn
              onClick={() => {
                initLevel(0, true);
                setScreen("play");
                getChiptune().start();
              }}
            >
              Começar
            </MenuBtn>
            <p className="mt-6 text-center text-xs text-white/70">
              Controles: ← → andar, ↑ / Espaço pular. Pegue o ☀️ para ganhar raios solares (8s) e pressione ↓ para atordoar as sombras.
            </p>
          </Overlay>
        )}

        {/* Game Over */}
        {screen === "gameover" && (
          <Overlay>
            <h2 className="mb-4 text-4xl font-bold text-white">Fim de Jogo</h2>
            <p className="mb-6 text-white/80">A Geógrafa tropeçou em uma rocha no caminho...</p>
            <MenuBtn
              onClick={() => {
                initLevel(0, true);
                setScreen("play");
              }}
            >
              Tentar de novo
            </MenuBtn>
          </Overlay>
        )}

        {/* Level complete */}
        {screen === "levelComplete" && (
          <Overlay>
            <h2 className="mb-4 text-3xl font-bold text-white">
              Fase {levelIdx + 1} concluída!
            </h2>
            <p className="mb-2 text-white/80">Você coletou uma Terra saudável 🌍</p>
            <p className="mb-6 text-lg font-bold text-yellow-300">Pontuação: {score}</p>
            <MenuBtn
              onClick={() => {
                initLevel(levelIdx + 1);
                setScreen("play");
              }}
            >
              Próxima fase
            </MenuBtn>
          </Overlay>
        )}

        {/* Win */}
        {screen === "win" && (
          <Overlay>
            <div className="mb-4 flex flex-col items-center">
              <div className="relative mb-3">
                {/* glow */}
                <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-300/40 blur-2xl" />
                {/* healthy Earth trophy */}
                <svg
                  width="160"
                  height="160"
                  viewBox="0 0 160 160"
                  className="relative drop-shadow-[0_0_25px_rgba(255,221,87,0.7)]"
                >
                  <defs>
                    <radialGradient id="ocean" cx="35%" cy="35%" r="70%">
                      <stop offset="0%" stopColor="#7ec8ff" />
                      <stop offset="60%" stopColor="#1e88e5" />
                      <stop offset="100%" stopColor="#0b3d70" />
                    </radialGradient>
                  </defs>
                  <circle cx="80" cy="80" r="64" fill="url(#ocean)" stroke="#fff" strokeWidth="3" />
                  {/* continents */}
                  <path
                    d="M40 70 q10 -18 28 -14 q12 4 6 18 q-4 10 -16 12 q-18 2 -18 -16z"
                    fill="#43a047"
                  />
                  <path
                    d="M92 50 q14 -6 22 6 q6 12 -6 18 q-12 4 -18 -4 q-6 -12 2 -20z"
                    fill="#66bb6a"
                  />
                  <path
                    d="M70 110 q18 -6 30 4 q6 8 -4 14 q-16 8 -28 0 q-8 -8 2 -18z"
                    fill="#43a047"
                  />
                  <circle cx="60" cy="55" r="3" fill="#fff" opacity="0.7" />
                  <circle cx="115" cy="95" r="2.5" fill="#fff" opacity="0.6" />
                </svg>
              </div>
              <span className="rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold uppercase tracking-wider text-black shadow-lg">
                Prêmio: Terra Saudável
              </span>
            </div>
            <h2 className="mb-3 text-4xl font-bold text-white">Vitória!</h2>
            <p className="mb-6 max-w-md text-center text-white/85">
              A Geógrafa venceu todas as fases e protegeu os solos do planeta Terra! 🌎✨
            </p>
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border-4 border-yellow-300 bg-black/60 px-8 py-4 text-center">
              <div>
                <div className="text-sm uppercase tracking-widest text-yellow-200">Pontuação da Fase 3</div>
                <div className="text-3xl font-extrabold text-white">{levelScores[2] - levelScores[1]}</div>
              </div>
              <div className="border-t border-white/20 pt-3">
                <div className="text-sm uppercase tracking-widest text-yellow-200">Pontuação Total</div>
                <div className="text-5xl font-extrabold text-white">{levelScores[2]}</div>
                <div className="mt-1 text-xs text-white/70">pontos</div>
              </div>
            </div>
            <MenuBtn
              onClick={() => {
                initLevel(0, true);
                setScreen("play");
              }}
            >
              Jogar de novo
            </MenuBtn>
          </Overlay>
        )}

        {/* Question dialog */}
        {screen === "play" && currentQuestion && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <div className="relative flex w-full max-w-3xl items-end gap-3">
              {/* Tree avatar (asks the question) */}
              <div className="flex shrink-0 flex-col items-center">
                <div className="relative flex h-20 w-20 items-end justify-center">
                  {/* canopy */}
                  <div className="absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 rounded-full bg-green-600 shadow-lg ring-4 ring-green-800/40" />
                  <div className="absolute left-1 top-3 h-8 w-8 rounded-full bg-green-600" />
                  <div className="absolute right-1 top-3 h-8 w-8 rounded-full bg-green-600" />
                  {/* trunk */}
                  <div className="relative z-10 h-7 w-3 rounded-sm bg-amber-900" />
                </div>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/90">
                  Árvore
                </span>
              </div>

              {/* Speech bubble */}
              <div className="relative flex-1 rounded-2xl border-4 border-black bg-white p-5 shadow-2xl">
                {/* tail pointing back to the shadow */}
                <div className="absolute -left-[18px] top-8 h-0 w-0 border-b-[14px] border-r-[20px] border-t-[14px] border-b-transparent border-r-black border-t-transparent" />
                <div className="absolute -left-[10px] top-[34px] h-0 w-0 border-b-[10px] border-r-[14px] border-t-[10px] border-b-transparent border-r-white border-t-transparent" />
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold uppercase tracking-wide text-neutral-700">
                    A árvore pergunta à Geógrafa…
                  </span>
                <div
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${
                    currentQuestion.timeLeft <= 10
                      ? "bg-red-100 text-red-700"
                      : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  ⏱ {currentQuestion.timeLeft}s
                </div>
              </div>
              <p className="mb-4 text-base leading-snug text-neutral-900">{currentQuestion.q.q}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {currentQuestion.q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => answerQuestion(i)}
                    className="rounded-lg border-2 border-neutral-300 bg-neutral-50 px-3 py-2 text-left text-sm font-medium text-neutral-900 transition hover:border-sky-500 hover:bg-sky-50 active:scale-[0.98]"
                  >
                    <span className="mr-2 font-bold text-sky-600">
                      {String.fromCharCode(65 + i)})
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile controls */}
        {screen === "play" && !currentQuestion && (
          <>
            <div className="absolute bottom-4 left-4 z-10 flex gap-3 select-none">
              <TouchBtn
                onDown={() => touchBtn("left", true)}
                onUp={() => touchBtn("left", false)}
                label="◀"
              />
              <TouchBtn
                onDown={() => touchBtn("right", true)}
                onUp={() => touchBtn("right", false)}
                label="▶"
              />
            </div>
            <div className="absolute bottom-4 right-4 z-10 flex gap-3 select-none">
              <TouchBtn
                onDown={() => touchBtn("shoot", true)}
                onUp={() => touchBtn("shoot", false)}
                label="☀️"
              />
              <TouchBtn
                onDown={() => touchBtn("jump", true)}
                onUp={() => touchBtn("jump", false)}
                label="⤴"
                big
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 p-6">
      {children}
    </div>
  );
}

function MenuBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border-4 border-yellow-300 bg-red-500 px-8 py-3 text-xl font-bold text-white shadow-lg transition hover:bg-red-600 active:scale-95"
    >
      {children}
    </button>
  );
}

function TouchBtn({
  onDown,
  onUp,
  label,
  big,
}: {
  onDown: () => void;
  onUp: () => void;
  label: string;
  big?: boolean;
}) {
  const size = big ? "h-20 w-20 text-3xl" : "h-16 w-16 text-2xl";
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onUp();
      }}
      onPointerLeave={() => onUp()}
      onPointerCancel={() => onUp()}
      onContextMenu={(e) => e.preventDefault()}
      className={`${size} flex items-center justify-center rounded-full border-4 border-white bg-black/55 font-bold text-white backdrop-blur active:bg-black/80`}
    >
      {label}
    </button>
  );
}
