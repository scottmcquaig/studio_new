// This file is used to safelist Tailwind CSS classes that are generated dynamically.
// By including these class names, we ensure that Tailwind's JIT compiler
// includes them in the final CSS build, even if they aren't statically visible in the code.

export const tailwindColorSafelist = [
    // This list corresponds to the `colorSelection` array in `src/app/admin/page.tsx`
    // We need to list all variants (text, bg, border) that might be used dynamically.
    
    // Gray
    'text-gray-500', 'border-gray-500', 'bg-gray-500',
    // Red
    'text-red-500', 'border-red-500', 'bg-red-500',
    // Orange
    'text-orange-500', 'border-orange-500', 'bg-orange-500',
    // Amber
    'text-amber-500', 'border-amber-500', 'bg-amber-500',
    // Yellow
    'text-yellow-500', 'border-yellow-500', 'bg-yellow-500',
    // Lime
    'text-lime-500', 'border-lime-500', 'bg-lime-500',
    // Green
    'text-green-500', 'border-green-500', 'bg-green-500',
    // Emerald
    'text-emerald-500', 'border-emerald-500', 'bg-emerald-500',
    // Teal
    'text-teal-500', 'border-teal-500', 'bg-teal-500',
    // Cyan
    'text-cyan-500', 'border-cyan-500', 'bg-cyan-500',
    // Sky
    'text-sky-500', 'border-sky-500', 'bg-sky-500',
    // Blue
    'text-blue-500', 'border-blue-500', 'bg-blue-500',
    // Indigo
    'text-indigo-500', 'border-indigo-500', 'bg-indigo-500',
    // Violet
    'text-violet-500', 'border-violet-500', 'bg-violet-500',
    // Purple
    'text-purple-500', 'border-purple-500', 'bg-purple-500',
    // Fuchsia
    'text-fuchsia-500', 'border-fuchsia-500', 'bg-fuchsia-500',
    // Pink
    'text-pink-500', 'border-pink-500', 'bg-pink-500',
    // Rose
    'text-rose-500', 'border-rose-500', 'bg-rose-500',
];

    