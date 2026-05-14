# Sherlock Components Guide

## Basic Elements

### Text
```yaml
- action: create
  element: text
  id: title
  content: "Hello World"
  x: 0
  y: 0
  fontSize: 48
  color: "#3B82F6"
  fontFamily: "Arial"
```

### Shapes
```yaml
# Circle
- action: create
  element: circle
  id: dot
  x: 0
  y: 0
  radius: 50
  fillColor: "#EF4444"

# Rectangle
- action: create
  element: rect
  id: box
  x: 0
  y: 0
  width: 100
  height: 60
  fillColor: "#10B981"

# Line
- action: create
  element: line
  id: connector
  x1: 0
  y1: 0
  x2: 100
  y2: 100
  strokeColor: "#8B5CF6"
  strokeWidth: 3
```

## Advanced Components

### Graph/Plot
```yaml
- action: create
  element: graph
  id: plot
  function: "sin(x)"
  xMin: -6.28
  xMax: 6.28
  color: "#06B6D4"
```

### Matrix
```yaml
- action: create
  element: matrix
  id: transform
  values:
    - [1, 0, 0]
    - [0, 1, 0]
    - [0, 0, 1]
  x: 0
  y: 0
```

### Neural Network
```yaml
- action: create
  element: neural_network
  id: brain
  layers: [3, 4, 2]
  x: 0
  y: 0
```

## Animation Properties

### Opacity
```yaml
- action: animate
  target: title
  property: opacity
  from: 0
  to: 1
  duration: 1
```

### Position
```yaml
- action: animate
  target: box
  property: x
  from: -200
  to: 200
  duration: 2
  easing: "easeInOut"
```

### Scale
```yaml
- action: animate
  target: circle
  property: scale
  from: 0.5
  to: 1.5
  duration: 1
```

### Color
```yaml
- action: animate
  target: shape
  property: color
  from: "#EF4444"
  to: "#10B981"
  duration: 1.5
```

## Easing Functions

- `linear` - Constant speed
- `easeIn` - Slow start
- `easeOut` - Slow end
- `easeInOut` - Smooth start and end
- `bounce` - Bouncy effect
- `elastic` - Spring effect

**Learn more:** `sherlock examples`
