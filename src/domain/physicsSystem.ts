import { GameConfig } from './gameConfig';
import { Bird } from './models';

/**
 * Handles physics calculations for the game.
 * Ported from Android PhysicsSystem.kt.
 */
export class PhysicsSystem {
  /**
   * Update bird physics for one frame.
   * Applies gravity, updates position, and smooths rotation.
   */
  updateBird(bird: Bird, deltaTime: number): Bird {
    const afterGravity = bird.applyGravity(
      GameConfig.GRAVITY,
      deltaTime,
      GameConfig.TERMINAL_VELOCITY,
    );
    return afterGravity.updateRotation();
  }

  /**
   * Apply flap impulse to bird.
   * Called when player submits correct answer.
   */
  applyFlap(bird: Bird): Bird {
    return bird.flap(GameConfig.FLAP_IMPULSE);
  }

  /**
   * Calculate the time for bird to fall a certain distance.
   * Uses kinematic equation: d = 0.5 * g * t^2 => t = sqrt(2d/g)
   */
  calculateFallTime(distance: number): number {
    return Math.sqrt((2 * distance) / GameConfig.GRAVITY);
  }

  /**
   * Calculate the distance bird will fall in a given time.
   * Uses kinematic equation: d = 0.5 * g * t^2
   */
  calculateFallDistance(time: number): number {
    return 0.5 * GameConfig.GRAVITY * time * time;
  }

  /**
   * Calculate the height bird will reach after a flap.
   * Uses kinematic equation: h = v^2 / (2g)
   */
  calculateFlapHeight(): number {
    const impulse = Math.abs(GameConfig.FLAP_IMPULSE);
    return (impulse * impulse) / (2 * GameConfig.GRAVITY);
  }
}
