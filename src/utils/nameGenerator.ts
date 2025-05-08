/**
 * Utility for generating random user names
 */

// List of adjectives for random name generation
const adjectives = [
  'Amazing', 'Bold', 'Creative', 'Daring', 'Elegant',
  'Friendly', 'Gentle', 'Happy', 'Inventive', 'Jolly',
  'Kind', 'Lively', 'Magical', 'Noble', 'Optimistic',
  'Peaceful', 'Quick', 'Resilient', 'Sincere', 'Thoughtful'
];

// List of animals for random name generation
const animals = [
  'Ant', 'Bear', 'Cat', 'Dolphin', 'Eagle',
  'Fox', 'Giraffe', 'Hedgehog', 'Iguana', 'Jaguar',
  'Koala', 'Lion', 'Monkey', 'Narwhal', 'Owl',
  'Penguin', 'Quokka', 'Rabbit', 'Squirrel', 'Tiger'
];

// List of colors for random user colors
const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA5A5', 
  '#98D4BB', '#ACD8AA', '#ECC30B', '#F6AE2D',
  '#F26419', '#86BBD8', '#758BFD', '#5CB8E4',
  '#FF9999', '#9FD8CB', '#FFBD59', '#A2D2FF'
];

/**
 * Generates a random name from adjective + animal combinations
 * @returns A random friendly name
 */
export function generateRandomName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  
  return `${adjective} ${animal}`;
}

/**
 * Generates a random color from a predefined list
 * @returns A hex color string
 */
export function generateRandomColor(): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generates a deterministic color based on a string ID
 * @param id String identifier to base the color on
 * @returns A hex color string
 */
export function getColorFromId(id: string): string {
  // Use the ID to deterministically pick a color
  const hash = id.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use the hash to pick from our predefined colors
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
} 