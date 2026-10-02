export function initializePlayerWorld(context) {
  this.ctx = context;
  this.live = false;
  this._probeT = 0;
  this._t = undefined;
  this.waterIds = new Set([`water`]);
  this.colliders = [];
  this._colT = 0;
  this.camMinR = 1;
  this.camOccluders = [];
}
