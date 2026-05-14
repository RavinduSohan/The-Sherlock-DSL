# Sherlock Primitives Quick Reference

## Core Primitives

### Vector3
3D vector with mathematical operations

```yaml
- action: create
  element: vector3
  id: myVector
  x: 1
  y: 2
  z: 0
```

**Methods:**
- `add(v)` - Add vectors
- `subtract(v)` - Subtract vectors
- `multiply(scalar)` - Scale vector
- `dot(v)` - Dot product
- `cross(v)` - Cross product
- `magnitude()` - Length
- `normalize()` - Unit vector

### Path
Smooth curves and animations

```yaml
- action: create
  element: path
  id: myPath
  points:
    - [0, 0]
    - [100, 100]
    - [200, 0]
  smooth: true
```

### BezierCurve
Precise curve control

```yaml
- action: create
  element: bezier
  id: curve
  start: [0, 0]
  control1: [50, 100]
  control2: [150, 100]
  end: [200, 0]
```

## Common Animations

### Move Along Path
```yaml
- action: animate
  target: object
  property: followPath
  path: myPath
  duration: 2
```

### Morph Between Shapes
```yaml
- action: morph
  from: circle
  to: square
  duration: 1.5
```

### Parametric Functions
```yaml
- action: create
  element: parametric
  id: spiral
  fx: "t * cos(t * 10)"
  fy: "t * sin(t * 10)"
  tMin: 0
  tMax: 6.28
```

## Tips

- Use `smooth: true` for organic motion
- Combine primitives for complex effects
- Check examples with `sherlock examples`

**Learn more:** `sherlock guide components`
