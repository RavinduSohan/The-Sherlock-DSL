# Sherlock Syntax Guide

## Scene Structure

```yaml
# Metadata (required)
concept: "Scene Description"
duration: 10  # seconds

# Scene timeline
scene:
  - at: 0        # timestamp in seconds
    action: ...  # what to do
    # ... action properties
```

## Actions

### Create Elements
```yaml
- at: 0
  action: create
  element: text|circle|rect|line|graph|...
  id: uniqueName
  # ... element properties
```

### Animate Properties
```yaml
- at: 1
  action: animate
  target: elementId
  property: x|y|opacity|scale|color|...
  from: startValue
  to: endValue
  duration: 2
  easing: easeInOut  # optional
```

### Update Elements
```yaml
- at: 3
  action: update
  target: elementId
  property: value
```

### Remove Elements
```yaml
- at: 5
  action: remove
  target: elementId
  duration: 0.5  # fade out time
```

## Timeline Control

### Sequential Actions
```yaml
scene:
  - at: 0
    action: create
    # ...
  
  - at: 2
    action: animate
    # ...
  
  - at: 5
    action: remove
    # ...
```

### Parallel Actions (same timestamp)
```yaml
scene:
  - at: 0
    action: create
    element: text
    id: title
  
  - at: 0
    action: create
    element: circle
    id: dot
```

### Wait and Delay
```yaml
- at: 2
  action: wait
  duration: 1  # pause for 1 second
```

## Best Practices

1. **Always set unique IDs** for elements you'll reference
2. **Use comments** to organize complex scenes
3. **Group related actions** at same timestamps
4. **Preview often** with `sherlock preview`
5. **Start simple** then add complexity

## Example Scene

```yaml
concept: "Simple Animation"
duration: 5

scene:
  # Create title
  - at: 0
    action: create
    element: text
    id: title
    content: "Hello, Sherlock!"
    x: 0
    y: 0
    fontSize: 48
    color: "#3B82F6"
    opacity: 0
  
  # Fade in title
  - at: 0
    action: animate
    target: title
    property: opacity
    from: 0
    to: 1
    duration: 1.5
    easing: easeInOut
  
  # Move title up
  - at: 2
    action: animate
    target: title
    property: y
    from: 0
    to: -100
    duration: 1.5
    easing: easeOut
```

**Try it:** Copy this example and run `sherlock preview scene.sherlock`

**Learn more:** `sherlock examples`
