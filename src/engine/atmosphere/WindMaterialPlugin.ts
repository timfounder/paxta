import { MaterialPluginBase } from '@babylonjs/core';
import type {
  Material,
  MaterialDefines,
  Nullable,
  StandardMaterial,
  UniformBuffer,
} from '@babylonjs/core';

import type { WindState } from './atmosphere.types';

const WIND_DEFINE = 'PAXTA_WIND';

/**
 * A tiny material plugin that bends a mesh's vertices in the wind on the GPU.
 * The displacement is proportional to vertex height and keyed off the instance's
 * world position, so co-located plants sway together and every hardware instance
 * animates for free — no per-instance CPU, no per-frame allocation. The single
 * {@link WindState} (shared by reference) is the only thing that changes per
 * frame; the GPU does the rest.
 */
class WindMaterialPlugin extends MaterialPluginBase {
  constructor(
    material: Material,
    private readonly state: WindState,
  ) {
    super(material, 'PaxtaWind', 200, { [WIND_DEFINE]: false });
    this._enable(true);
  }

  public override getClassName(): string {
    return 'WindMaterialPlugin';
  }

  public override prepareDefines(defines: MaterialDefines): void {
    defines[WIND_DEFINE] = true;
  }

  public override getUniforms(): {
    ubo: { name: string; size: number; type: string }[];
    vertex: string;
  } {
    return {
      ubo: [{ name: 'windParams', size: 4, type: 'vec4' }],
      vertex: `#ifdef ${WIND_DEFINE}\nuniform vec4 windParams;\n#endif`,
    };
  }

  public override bindForSubMesh(uniformBuffer: UniformBuffer): void {
    uniformBuffer.updateFloat4(
      'windParams',
      this.state.phase,
      this.state.amplitudeX,
      this.state.amplitudeZ,
      0,
    );
  }

  public override getCustomCode(shaderType: string): Nullable<Record<string, string>> {
    if (shaderType !== 'vertex') return null;
    return {
      CUSTOM_VERTEX_UPDATE_POSITION: `
        #ifdef ${WIND_DEFINE}
        float windPhase = windParams.x;
        #ifdef INSTANCES
        // Per-instance offset (the instance's world translation) so co-located
        // plants share a phase and neighbours don't sway in lockstep.
        windPhase += (world3.x + world3.z) * 0.2;
        #endif
        float windHeight = max(positionUpdated.y, 0.0);
        positionUpdated.x += sin(windPhase) * windParams.y * windHeight;
        positionUpdated.z += cos(windPhase * 0.8) * windParams.z * windHeight;
        #endif
      `,
    };
  }
}

/**
 * Attach the wind plugin to each canopy material. The materials must be left
 * dynamic for their wind uniform to update, so any prior freeze is lifted first.
 */
export const applyWind = (materials: readonly StandardMaterial[], state: WindState): void => {
  for (const material of materials) {
    material.unfreeze();
    // Constructing the plugin registers it on the material (its intended effect).
    void new WindMaterialPlugin(material, state);
  }
};
