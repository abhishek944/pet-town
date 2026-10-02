import { assemblePropMaterialMeshes } from "./assemble-prop-material-meshes.js";
import { bakePropVertexColors } from "./bake-prop-vertex-colors.js";
/** UV generation, transform composition, vertex color baking and material-batched geometry builder. */
import * as THREE from "three";
import { PropRandom } from "../math/prop-random.js";
import { createPropTransformMatrix } from "./create-prop-transform-matrix.js";
import { assignPropGeometryUvs } from "./assign-prop-geometry-uvs.js";
export let PropGeometryBuilder = class {
  constructor(value = 7) {
    this.buckets = new Map();
    this.root = new THREE.Matrix4();
    this.stack = [new THREE.Matrix4()];
    this.aoH = 0.9;
    this.aoMin = 0.5;
    this.rng = new PropRandom(value);
    this.tag = null;
    this.tags = new Map();
  }
  begin(
    value = 0,
    value2 = 0,
    value3 = 0,
    value4 = 0,
    { aoH: value5 = 0.9, aoMin: value6 = 0.5 } = {},
  ) {
    this.root = createPropTransformMatrix(value, value2, value3, 0, value4, 0);
    this.stack = [new THREE.Matrix4()];
    this.aoH = value5;
    this.aoMin = value6;
    return this;
  }
  get top() {
    return this.stack[this.stack.length - 1];
  }
  push(value = 0, value2 = 0, value3 = 0, value4 = 0, value5 = 0, value6 = 0, value7 = 1) {
    this.stack.push(
      this.top
        .clone()
        .multiply(
          createPropTransformMatrix(
            value,
            value2,
            value3,
            value4,
            value5,
            value6,
            value7,
            value7,
            value7,
          ),
        ),
    );
    return this;
  }
  pop() {
    if (this.stack.length > 1) {
      this.stack.pop();
    }
    return this;
  }
  add(value, indexValue, position = {}) {
    if (indexValue.index) {
      indexValue = indexValue.toNonIndexed();
    }
    for (let result of Object.keys(indexValue.attributes)) {
      if (result !== `position` && result !== `normal` && result !== `uv`) {
        indexValue.deleteAttribute(result);
      }
    }
    if (!indexValue.attributes.normal) {
      indexValue.computeVertexNormals();
    }
    assignPropGeometryUvs(indexValue, position.uv, value, this.rng);
    indexValue.applyMatrix4(
      this.top
        .clone()
        .multiply(
          createPropTransformMatrix(
            position.x || 0,
            position.y || 0,
            position.z || 0,
            position.rx || 0,
            position.ry || 0,
            position.rz || 0,
            position.sx ?? 1,
            position.sy ?? 1,
            position.sz ?? 1,
          ),
        ),
    );
    this.bake(indexValue, position);
    indexValue.applyMatrix4(this.root);
    let values = this.buckets.get(value);
    if (!values) {
      this.buckets.set(value, (values = []));
      this.tags.set(value, []);
    }
    values.push(indexValue);
    this.tags.get(value).push(this.tag);
    return indexValue;
  }
  bake(...args) {
    return bakePropVertexColors.apply(this, args);
  }
  build(...args) {
    return assemblePropMaterialMeshes.apply(this, args);
  }
};
