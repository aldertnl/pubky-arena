import { BookOpen, UserRoundPlus } from 'lucide-react';
import { Button } from '@/atoms/Button/Button';
import { Container } from '@/atoms/Container/Container';
import { cn } from '@/libs/utils/utils';

interface ActionButtonsProps {
  className?: React.HTMLAttributes<HTMLDivElement>['className'];
  onLearn?: () => void;
  onCreateAccount?: () => void;
  learnText?: string;
  createAccountText?: string;
}
export function ActionButtons({
  className,
  onLearn,
  onCreateAccount,
  learnText = 'Learn more',
  createAccountText = 'Join now',
  ...props
}: ActionButtonsProps) {
  return (
    <Container className={cn('gap-3 sm:flex-row sm:items-center', className)} {...props}>
      <Button id="learn-btn" variant="secondary" className="w-full sm:w-auto" size="lg" onClick={onLearn}>
        <BookOpen className="mr-2 h-4 w-4" />
        {learnText}
      </Button>
      <Button id="create-account-btn" variant="brand" className="w-full sm:w-auto" size="lg" onClick={onCreateAccount}>
        <UserRoundPlus className="mr-2 h-4 w-4" />
        {createAccountText}
      </Button>
    </Container>
  );
}
