//IMPORTANT: Make sure to use Kaboom version 0.5.0 for this game by adding the correct script tag in the HTML file.

kaboom({
  global: true,
  fullscreen: true,
  scale: 2,
  debug: true,
  clearColor: [107/255, 140/255, 255/255, 1],
})

const MOVE_SPEED = 120
const JUMP_FORCE = 360
const BIG_JUMP_FORCE = 550
let CURRENT_JUMP_FORCE = JUMP_FORCE
const FALL_DEATH = 400

let isJumping = true

// ============================================================
//   SPRITES — URLs completas, sin loadRoot (evita el bug de prefijo)
// ============================================================
// Remotos (set de Anna del repo original)
const IMG = 'https://i.imgur.com/'
loadSprite('coin', IMG + 'wbKxhcd.png')
loadSprite('evil-shroom', IMG + 'KPO3fR9.png')
loadSprite('brick', IMG + 'pogC9x5.png')
loadSprite('block', IMG + 'M6rwarW.png')
loadSprite('mario', IMG + 'Wb1qfhK.png')
loadSprite('mushroom', IMG + '0wMd92p.png')
loadSprite('surprise', IMG + 'gesQ1KP.png')
loadSprite('unboxed', IMG + 'bdrLpi6.png')
loadSprite('pipe-top-left', IMG + 'ReTPiWY.png')
loadSprite('pipe-top-right', IMG + 'hj2GK4n.png')
loadSprite('pipe-bottom-left', IMG + 'c1cYSbt.png')
loadSprite('pipe-bottom-right', IMG + 'nqQ79eI.png')
loadSprite('blue-block', IMG + 'fVscIbn.png')
loadSprite('blue-brick', IMG + '3e5YRQd.png')
loadSprite('blue-steel', IMG + 'gqVoI2b.png')
loadSprite('blue-evil-shroom', IMG + 'SvV4ueD.png')
loadSprite('blue-surprise', IMG + 'RMqCc1G.png')

// Locales (tus diseños en sprites/)
loadSprite('pole', 'sprites/pole.png')
loadSprite('castle', 'sprites/castle.png')
loadSprite('bullet', 'sprites/bullet.png')
loadSprite('turtle', 'sprites/turtle.gif')
loadSprite('fortress', 'sprites/fortress.png')


scene("game", ({ level, score }) => {
  layers(['bg', 'obj', 'ui'], 'obj')

  const bgColors = [
    [107/255, 140/255, 255/255],
    [0, 0, 0],
    [80/255, 30/255, 30/255],
  ]
  add([
    rect(width() * 10, height() * 5),
    pos(-width() * 2, -height() * 2),
    color(bgColors[level][0], bgColors[level][1], bgColors[level][2]),
    layer('bg'),
  ])

  function drawCloud(x, y) {
    const cloudColor = level === 2 ? [1, 0.7, 0.8] : [1, 1, 1]
    const parts = [
      [0, 8, 32, 12],
      [6, 4, 22, 8],
      [12, 0, 12, 6],
      [4, 12, 28, 4],
    ]
    parts.forEach(([dx, dy, w, h]) => {
      add([
        rect(w, h),
        pos(x + dx, y + dy),
        color(cloudColor[0], cloudColor[1], cloudColor[2]),
        layer('bg'),
      ])
    })
  }

  if (level === 0) {
    drawCloud(40, 30);  drawCloud(180, 50); drawCloud(320, 25)
    drawCloud(480, 45); drawCloud(640, 30); drawCloud(800, 50)
  } else if (level === 2) {
    drawCloud(60, 35);  drawCloud(240, 50); drawCloud(420, 30)
    drawCloud(600, 45); drawCloud(780, 35)
  }

  // ----- MAPAS -----
  // Símbolos:
  //   F = bandera fin de nivel (pole.png)
  //   D = puerta del castillo (castle.png)
  //   b = enemigo bala (bullet.png) — rápido, recto
  //   t = enemigo tortuga (turtle.gif) — velocidad media
  const maps = [
    // NIVEL 1 — bandera con fortress decorativo al lado
    [
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '       %=*=%=                  =$$$=                      ',
      '                                                          ',
      '              ^   t              v        ^      F   Z   ',
      '==========================================================',
    ],
    // NIVEL 2 — sin bala, bandera y pipa con espacio entre ellas
    [
      '£                                                          £',
      '£                                                          £',
      '£                                                          £',
      '£                                                          £',
      '£                                                          £',
      '£                                                          £',
      '£                                                          £',
      '£                                                          £',
      '£                                                          £',
      '£       @@@@@@              x x              @@@           £',
      '£                                                          £',
      '£    z   t  v   ^       x x x x x      z    v   F      Z   £',
      '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
    ],
    // NIVEL 3 — pocos monstruos, bien separados
    [
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '      %=*=%             $$$$$              =%*%=                  ',
      '                                                                  ',
      '   $$$    b              v       z              t           D     ',
      '==================================================================',
    ],
  ]

  const levelCfg = {
    width: 20,
    height: 20,
    '=': [sprite('block'), solid(), 'wall'],
    '$': [sprite('coin'), 'coin'],
    '%': [sprite('surprise'), solid(), 'wall', 'coin-surprise'],
    '*': [sprite('surprise'), solid(), 'wall', 'mushroom-surprise'],
    '}': [sprite('unboxed'), solid(), 'wall'],
    '(': [sprite('pipe-bottom-left'), solid(), scale(0.5), 'wall'],
    ')': [sprite('pipe-bottom-right'), solid(), scale(0.5), 'wall'],
    '-': [sprite('pipe-top-left'), solid(), scale(0.5), 'wall', 'pipe'],
    '+': [sprite('pipe-top-right'), solid(), scale(0.5), 'wall', 'pipe'],
    '^': [sprite('evil-shroom'), solid(), body(), 'dangerous', 'enemy-normal'],
    '#': [sprite('mushroom'), solid(), 'mushroom', body()],
    '!': [sprite('blue-block'), solid(), scale(0.5), 'wall'],
    '£': [sprite('blue-brick'), solid(), scale(0.5), 'wall'],
    'z': [sprite('blue-evil-shroom'), solid(), body(), scale(0.5), 'dangerous', 'enemy-blue'],
    '@': [sprite('blue-surprise'), solid(), scale(0.5), 'wall', 'coin-surprise'],
    'x': [sprite('blue-steel'), solid(), scale(0.5), 'wall'],
    'r': [sprite('evil-shroom'), solid(), body(), color(1, 0.4, 0.4), 'dangerous', 'enemy-red'],
    'v': [sprite('blue-evil-shroom'), solid(), body(), scale(0.5), color(0.7, 0.4, 1), 'dangerous', 'enemy-violet'],
    // ENEMIGOS LOCALES
    'b': [sprite('bullet'), solid(), body(), 'dangerous', 'enemy-bullet'],
    't': [sprite('turtle'), solid(), body(), 'dangerous', 'enemy-turtle'],
    // FIN DE NIVEL — markers INVISIBLES, reposicionados después del addLevel
    'F': [rect(80, 80), color(0, 0, 0, 0), 'flag-marker'],
    'D': [rect(200, 100), color(0, 0, 0, 0), 'door-marker'],
    // Fortress: igual que el castillo pero pasa al siguiente nivel (no es el final)
    'Z': [rect(120, 100), color(0, 0, 0, 0), 'fortress-marker'],
  }

  const gameLevel = addLevel(maps[level], levelCfg)

  // Agregar sprites visibles de bandera/castillo (decorativos, separados del hitbox)
  // Y reposicionar los hitboxes para que cubran la zona del piso amplia
  every('flag-marker', (f) => {
    add([
      sprite('pole'),
      pos(f.pos.x, f.pos.y + 20),
      origin('bot'),
    ])
    // Hitbox cubre desde un poco antes hasta un poco después de la bandera, al nivel del piso
    f.pos.x -= 20
    f.pos.y -= 20
  })
  every('door-marker', (d) => {
    add([
      sprite('castle'),
      pos(d.pos.x, d.pos.y + 20),
      origin('bot'),
    ])
    // Hitbox cubre una zona grande alrededor del castillo
    d.pos.x -= 80
    d.pos.y -= 40
  })

  // Fortress: decorativo al lado de la bandera (niveles 1 y 2)
  // Funciona como el castillo pero para pasar al siguiente nivel
  every('fortress-marker', (f) => {
    add([
      sprite('fortress'),
      pos(f.pos.x, f.pos.y + 20),
      origin('bot'),
    ])
    // Hitbox cubre una zona amplia alrededor del fortress
    f.pos.x -= 40
    f.pos.y -= 30
  })

  const scoreLabel = add([
    text('puntaje: ' + score),
    pos(20, 20),
    layer('ui'),
    { value: score }
  ])

  const levelLabel = add([
    text('nivel ' + parseInt(level + 1)),
    pos(20, 50),
    layer('ui'),
  ])

  // Mantener los labels fijos en pantalla siguiendo a la cámara.
  // En Kaboom 0.5, los objetos UI no siguen a la cámara automáticamente,
  // así que actualizamos su posición en cada frame.
  scoreLabel.action(() => {
    scoreLabel.pos.x = camPos().x - width() / 2 + 20
    scoreLabel.pos.y = camPos().y - height() / 2 + 20
  })
  levelLabel.action(() => {
    levelLabel.pos.x = camPos().x - width() / 2 + 20
    levelLabel.pos.y = camPos().y - height() / 2 + 50
  })

  function big() {
    let isBig = false
    return {
      update() {
        if (isBig) {
          CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
        } else {
          CURRENT_JUMP_FORCE = JUMP_FORCE
        }
      },
      isBig() { return isBig },
      smallify() {
        this.scale = vec2(1)
        CURRENT_JUMP_FORCE = JUMP_FORCE
        isBig = false
      },
      biggify() {
        this.scale = vec2(2)
        isBig = true
      }
    }
  }

  const player = add([
    sprite('mario'), solid(),
    pos(30, 0),
    body(),
    big(),
    origin('bot')
  ])

  action('mushroom', (m) => {
    m.move(20, 0)
  })

  player.on("headbump", (obj) => {
    if (obj.is('coin-surprise')) {
      gameLevel.spawn('$', obj.gridPos.sub(0, 1))
      destroy(obj)
      gameLevel.spawn('}', obj.gridPos.sub(0, 0))
    }
    if (obj.is('mushroom-surprise')) {
      gameLevel.spawn('#', obj.gridPos.sub(0, 1))
      destroy(obj)
      gameLevel.spawn('}', obj.gridPos.sub(0, 0))
    }
  })

  player.collides('mushroom', (m) => {
    destroy(m)
    player.biggify()
  })

  player.collides('coin', (c) => {
    destroy(c)
    scoreLabel.value++
    scoreLabel.text = 'puntaje: ' + scoreLabel.value
  })

  // ----- ENEMIGOS -----
  // Velocidades por tipo
  const speedOf = (e) => {
    if (e.is('enemy-red')) return 60
    if (e.is('enemy-violet')) return 25
    if (e.is('enemy-blue')) return 40
    if (e.is('enemy-bullet')) return 90    // la bala vuela
    if (e.is('enemy-turtle')) return 35    // tortuga ritmo medio
    return 30
  }

  action('dangerous', (e) => {
    if (e._dir === undefined) {
      e._dir = -1
      e._prevX = e.pos.x
      e._stillFrames = 0
      e._gracePeriod = 10
    }
  })

  action('dangerous', (e) => {
    if (e._dir === undefined) return
    e.move(speedOf(e) * e._dir, 0)
  })

  action('dangerous', (e) => {
    if (e._dir === undefined) return
    if (e._gracePeriod > 0) {
      e._gracePeriod--
      e._prevX = e.pos.x
      return
    }
    // Todos los enemigos rebotan igual ahora
    const dx = Math.abs(e.pos.x - e._prevX)
    if (dx < 0.2) {
      e._stillFrames++
      if (e._stillFrames >= 3) {
        e._dir = -e._dir
        e._stillFrames = 0
      }
    } else {
      e._stillFrames = 0
    }
    e._prevX = e.pos.x
  })

  collides('dangerous', 'dangerous', (a, b) => {
    if (a._dir !== undefined && b._dir !== undefined) {
      a._dir = -a._dir
      b._dir = -b._dir
    }
  })

  player.collides('dangerous', (d) => {
    if (isJumping) {
      destroy(d)
    } else if (player.isBig()) {
      // Mario grande: en vez de morir, se hace chico y el enemigo desaparece
      player.smallify()
      destroy(d)
    } else {
      go('lose', { score: scoreLabel.value })
    }
  })

  player.action(() => {
    // Bajamos la cámara: Mario queda en el tercio inferior de la pantalla
    // (la cámara mira un poco arriba de Mario, así el cielo ocupa más espacio)
    camPos(player.pos.x, player.pos.y - height() / 6)
    if (player.pos.y >= FALL_DEATH) {
      go('lose', { score: scoreLabel.value })
    }
  })

  // ----- TRANSICIÓN DE NIVEL -----
  // Chequeamos cada frame si Mario está cerca de bandera/castillo/fortress/pipa,
  // así no depende de un evento de colisión que puede dispararse una sola vez.
  let onPipe = false
  let onFlag = false
  let onDoor = false
  let onFortress = false
  let won = false

  player.action(() => {
    onPipe = false
    onFlag = false
    onDoor = false
    onFortress = false
    every('pipe', (p) => {
      if (player.isOverlapped(p)) onPipe = true
    })
    every('flag-marker', (f) => {
      if (player.isOverlapped(f)) onFlag = true
    })
    every('door-marker', (d) => {
      if (player.isOverlapped(d)) onDoor = true
    })
    every('fortress-marker', (f) => {
      if (player.isOverlapped(f)) onFortress = true
    })
  })

  // Bandera: pasar de nivel con flecha ARRIBA
  keyPress('up', () => {
    if (!onFlag || won) return
    go('game', { level: level + 1, score: scoreLabel.value })
  })

  // Castillo final: disparar mensaje con flecha DERECHA
  // Fortress (niveles 1 y 2): pasar al siguiente nivel con flecha DERECHA
  keyPress('right', () => {
    if (won) return
    if (onDoor) {
      won = true
      showWinOverlay(scoreLabel.value)
    } else if (onFortress) {
      go('game', { level: level + 1, score: scoreLabel.value })
    }
  })

  // Pipa tradicional: flecha ABAJO
  keyPress('down', () => {
    if (!onPipe || won) return
    if (level + 1 >= maps.length) {
      won = true
      showWinOverlay(scoreLabel.value)
    } else {
      go('game', { level: level + 1, score: scoreLabel.value })
    }
  })

  function showWinOverlay(finalScore) {
    const big = Math.max(10, Math.min(20, width() / 30))
    const small = Math.max(8, Math.min(14, width() / 45))
    add([
      text('so buena banana vo', big),
      origin('center'),
      pos(camPos().x, camPos().y - 15),
      color(1, 1, 1),
    ])
    add([
      text('puntaje: ' + finalScore, small),
      origin('center'),
      pos(camPos().x, camPos().y + 15),
      color(1, 1, 1),
    ])
  }

  keyDown('left', () => {
    if (won) return
    player.move(-MOVE_SPEED, 0)
  })

  keyDown('right', () => {
    if (won) return
    player.move(MOVE_SPEED, 0)
  })

  player.action(() => {
    if (player.grounded()) {
      isJumping = false
    }
  })

  keyPress('space', () => {
    if (won) return
    if (player.grounded()) {
      isJumping = true
      player.jump(CURRENT_JUMP_FORCE)
    }
  })
})

scene('lose', ({ score }) => {
  // Usamos tamaños proporcionales al canvas para que se vea bien en cualquier pantalla
  const fontSize = Math.max(10, Math.min(20, width() / 30))
  add([
    rect(width(), height()),
    pos(0, 0),
    color(0, 0, 0),
  ])
  add([
    text('perdiste!\npuntaje: ' + score, fontSize),
    origin('center'),
    pos(width() / 2, height() / 2),
    color(1, 1, 1),
  ])
  keyPress('space', () => {
    go('game', { level: 0, score: 0 })
  })
  // También permitir tap en mobile para reintentar
  mouseClick(() => {
    go('game', { level: 0, score: 0 })
  })
})

start("game", { level: 0, score: 0 })