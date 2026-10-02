import { playerAnimationSpring } from "../animation-math/player-animation-spring.js";
export function initializePlayerAnimationState() {
  this.t = 0;
  this.phase = 0;
  this.swimPhase = 0;
  this.w = {
    ground: 1,
    air: 0,
    glide: 0,
    swim: 0,
    move: 0,
  };
  this.runAmt = 0;
  this.sq = new playerAnimationSpring(260, 13);
  this.leafS = new playerAnimationSpring(320, 15);
  this.earS = [new playerAnimationSpring(120, 7), new playerAnimationSpring(120, 7)];
  this.earSide = new playerAnimationSpring(100, 7);
  this.tailS = new playerAnimationSpring(90, 6);
  this.tailP = new playerAnimationSpring(90, 8, 0.35);
  this.tail2S = new playerAnimationSpring(60, 5);
  this.sproutS = new playerAnimationSpring(110, 5);
  this.sproutZ = new playerAnimationSpring(90, 5);
  this.scarfS = new playerAnimationSpring(70, 6);
  this.scarfS2 = new playerAnimationSpring(90, 6);
  this.neckS = new playerAnimationSpring(140, 9);
  this.accS = 0;
  this.lean = 0;
  this.bank = 0;
  this.prevSpeed = 0;
  this.prevFacing = 0;
  this.turnRate = 0;
  this.blinkT = 2;
  this.blink = 0;
  this.doubleBlink = false;
  this.lidAmt = 0;
  this.lookYaw = 0;
  this.lookPitch = 0;
  this.idleT = 0;
  this.glanceT = 3;
  this.glanceYaw = 0;
  this.glancePitch = 0;
  this.headVy = 0;
  this.prevHeadY = 0;
  this.mouth = 0;
  this.prevFoot = 0;
  this.swimSplashT = 0;
  this.happy = 0;
  this.fidget = null;
  this.knit = 0;
  this.raise = 0;
  this.worry = 0;
  this.happyEyes = 0;
  this.events = [];
}
