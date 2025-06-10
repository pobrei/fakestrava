# GPX Form with React Hook Form and Zod Validation

This project demonstrates a comprehensive GPX generation form built with modern React patterns and validation.

## 🚀 Features

### Form Validation
- **Zod Schema Validation**: Comprehensive validation with custom rules
- **Activity-Specific Ranges**: Different speed/pace limits for running vs cycling
- **Real-time Validation**: Instant feedback as users type
- **TypeScript Integration**: Full type safety throughout the form

### User Experience
- **Speed ↔ Pace Conversion**: Automatic conversion when switching input types
- **Live Preview**: Real-time duration estimation based on distance and speed/pace
- **Activity-Specific Defaults**: Smart defaults based on selected activity type
- **Accessible Design**: Proper ARIA labels and keyboard navigation

### Technical Implementation
- **react-hook-form**: Efficient form state management with minimal re-renders
- **@hookform/resolvers/zod**: Seamless integration between react-hook-form and zod
- **shadcn/ui**: Modern, accessible UI components
- **Next.js 14**: App Router with TypeScript support

## 📋 Form Fields

### Required Fields
- **Route Name**: 1-100 characters
- **Activity Type**: Running or Cycling
- **Input Type**: Speed (km/h) or Pace (min/km)
- **Speed/Pace Value**: Activity-specific realistic ranges

### Optional Fields
- **Description**: Up to 500 characters

### Validation Ranges

#### Running
- **Speed**: 3-25 km/h (realistic running speeds)
- **Pace**: 2.4-20 min/km (equivalent to speed range)

#### Cycling
- **Speed**: 5-60 km/h (realistic cycling speeds)
- **Pace**: 1-12 min/km (equivalent to speed range)

## 🛠 Technical Details

### Dependencies Added
```bash
npm install react-hook-form zod @hookform/resolvers
npx shadcn@latest add form label select radio-group
```

### Key Files Created
- `components/GPXForm.tsx` - Main form component
- `types/index.ts` - TypeScript interfaces
- `app/gpx-form/page.tsx` - Demo page
- `lib/gpx.ts` - Enhanced with utility functions

### Form Schema (Zod)
```typescript
const gpxFormSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  activityType: z.enum(['Run', 'Bike']),
  inputType: z.enum(['speed', 'pace']),
  averageSpeedKmh: z.number().min(1).max(100),
  averagePaceMinPerKm: z.number().min(1).max(30),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
  distance: z.number().min(0.1),
}).refine(/* activity-specific validation */)
```

## 🎯 Usage

1. **Load Sample Route**: Click to populate with example coordinates
2. **Fill Form**: Enter route name, select activity type
3. **Choose Input Type**: Speed (km/h) or Pace (min/km)
4. **Enter Value**: Form validates based on activity type
5. **Preview**: See estimated duration automatically calculated
6. **Submit**: Generates and downloads GPX file

## 🔧 Form Features Demo

### Validation Testing
Try these to see validation in action:
- Clear the route name (required field error)
- Enter speed > 25 km/h for running (range validation)
- Enter speed < 5 km/h for cycling (range validation)
- Switch between speed and pace (automatic conversion)
- Enter very long description >500 chars (length validation)

### Real-time Features
- **Live Preview**: Duration updates as you change speed/pace
- **Smart Conversion**: Speed automatically converts to pace and vice versa
- **Activity Defaults**: Form adjusts defaults when switching activities
- **Validation Feedback**: Immediate error messages with helpful hints

## 📁 File Structure

```
components/
├── GPXForm.tsx              # Main form component
├── ui/                      # shadcn/ui components
│   ├── form.tsx
│   ├── label.tsx
│   ├── select.tsx
│   └── radio-group.tsx
types/
└── index.ts                 # Form interfaces
app/
└── gpx-form/
    └── page.tsx             # Demo page
lib/
└── gpx.ts                   # GPX generation + utilities
```

## 🎨 Styling

- **TailwindCSS**: Utility-first styling
- **shadcn/ui**: Consistent design system
- **Responsive**: Mobile-friendly layout
- **Dark Mode**: Supports system preference

## 🧪 Testing

Basic test structure included in `components/__tests__/GPXForm.test.tsx`:
- Form rendering
- Validation rules
- Speed/pace conversion
- Submit handling
- Error states

## 🚀 Next Steps

Potential enhancements:
- [ ] Route visualization on map
- [ ] Multiple activity types (walking, hiking)
- [ ] Elevation profile integration
- [ ] GPX file preview before download
- [ ] Batch GPX generation
- [ ] Custom validation rules per user
- [ ] Integration with fitness platforms

## 📝 Notes

- Form uses controlled components for optimal performance
- Validation runs on both client and schema level
- GPX generation includes realistic timestamps and elevation
- All form state is properly typed with TypeScript
- Accessibility features included (ARIA labels, keyboard navigation)
