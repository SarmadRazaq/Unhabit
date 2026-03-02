# Onboarding Images

Place your onboarding illustration images here:

1. `tell-habit.png` - Person with checklist illustration (Slide 2)
2. `journey.png` - Calendar with people illustration (Slide 3)
3. `track.png` - Progress chart with person illustration (Slide 4)

## Recommended Image Sizes

- Width: 300-400px
- Height: 250-350px
- Format: PNG with transparent background
- Resolution: 2x or 3x for retina displays

## Usage

After adding images, update the `slides` array in:
`src/screens/onboarding/OnboardingTutorialScreen.tsx`

```tsx
const slides: SlideData[] = [
  {
    id: '1',
    title: 'Meet Nudge',
    subtitle: 'Your smart AI coach here to guide your habit journey',
    imageSource: null,
    showMascotOnly: true,
  },
  {
    id: '2',
    title: 'Tell Us Your Habit',
    subtitle: "We'll learn what's holding you back.",
    imageSource: require('../../../assets/onboarding/tell-habit.png'),
  },
  {
    id: '3',
    title: 'Get Your 21-day Journey',
    subtitle: 'AI designs a plan built just for you.',
    imageSource: require('../../../assets/onboarding/journey.png'),
  },
  {
    id: '4',
    title: 'Track & Transform',
    subtitle: 'Stay consistent and see real change.',
    imageSource: require('../../../assets/onboarding/track.png'),
  },
];
```

