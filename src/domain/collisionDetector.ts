import { Bird, Pipe, Rect, CollisionResult } from './models';

/**
 * Handles collision detection between game entities.
 * Uses circle-vs-AABB for the bird and AABB for pipes.
 * Ported from Android CollisionDetector.kt.
 */
export class CollisionDetector {
  /**
   * Check for collisions between bird and environment.
   * Bird uses a circular hitbox; pipes use axis-aligned rectangles.
   */
  checkCollision(
    bird: Bird,
    pipes: readonly Pipe[],
    screenHeight: number,
  ): CollisionResult {
    const cx = bird.x;
    const cy = bird.hitboxCenterY;
    const r = bird.hitboxRadius;

    // Check ceiling collision
    if (cy - r <= 0) {
      return { hitObstacle: true, hitCeiling: true, hitFloor: false };
    }

    // Check floor collision
    if (cy + r >= screenHeight) {
      return { hitObstacle: true, hitCeiling: false, hitFloor: true };
    }

    // Check pipe collisions (circle vs rect)
    for (const pipe of pipes) {
      const topBounds = pipe.topPipeBounds(screenHeight);
      if (this.circleIntersectsRect(cx, cy, r, topBounds)) {
        return { hitObstacle: true, hitCeiling: false, hitFloor: false };
      }

      const bottomBounds = pipe.bottomPipeBounds(screenHeight);
      if (this.circleIntersectsRect(cx, cy, r, bottomBounds)) {
        return { hitObstacle: true, hitCeiling: false, hitFloor: false };
      }
    }

    // No collision
    return { hitObstacle: false, hitCeiling: false, hitFloor: false };
  }

  /**
   * Check which pipes have been passed for scoring.
   * Returns the number of newly passed (unscored) pipes.
   */
  checkScoring(bird: Bird, pipes: readonly Pipe[]): number {
    return pipes.filter((pipe) => !pipe.scored && pipe.hasBeenPassed(bird.x))
      .length;
  }

  /**
   * Mark passed pipes as scored.
   * Returns a new array with scoring flags updated.
   */
  updateScoredPipes(bird: Bird, pipes: readonly Pipe[]): Pipe[] {
    return pipes.map((pipe) => {
      if (!pipe.scored && pipe.hasBeenPassed(bird.x)) {
        return pipe.markAsScored();
      }
      return pipe;
    });
  }

  /**
   * Circle-vs-AABB intersection test.
   * Finds the closest point on the rectangle to the circle center,
   * then checks if that point is within the circle's radius.
   */
  private circleIntersectsRect(
    cx: number,
    cy: number,
    r: number,
    rect: Rect,
  ): boolean {
    const closestX = clamp(cx, rect.left, rect.right);
    const closestY = clamp(cy, rect.top, rect.bottom);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= r * r;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
