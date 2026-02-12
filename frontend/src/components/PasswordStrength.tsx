import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const strength = useMemo(() => {
    let score = 0;
    if (!password) return { score: 0, label: '', color: '' };

    // Longueur
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Minuscules et majuscules
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;

    // Chiffres
    if (/\d/.test(password)) score++;

    // Caractères spéciaux
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Très faible', color: 'bg-red-500' },
      { score: 2, label: 'Faible', color: 'bg-orange-500' },
      { score: 3, label: 'Moyen', color: 'bg-yellow-500' },
      { score: 4, label: 'Fort', color: 'bg-lime-500' },
      { score: 5, label: 'Très fort', color: 'bg-green-500' }
    ];

    return levels[score];
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2 mb-1">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength.score < 3 ? 'text-red-600' : 
          strength.score < 4 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>
      <ul className="text-xs text-gray-600 space-y-1">
        <li className={password.length >= 8 ? 'text-green-600' : ''}>
          ✓ Au moins 8 caractères
        </li>
        <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-600' : ''}>
          ✓ Majuscules et minuscules
        </li>
        <li className={/\d/.test(password) ? 'text-green-600' : ''}>
          ✓ Au moins un chiffre
        </li>
        <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : ''}>
          ✓ Au moins un caractère spécial
        </li>
      </ul>
    </div>
  );
};
