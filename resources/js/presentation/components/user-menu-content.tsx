import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/presentation/components/ui/dropdown-menu';
import { UserInfo } from '@/presentation/components/user-info';
import { useAuth } from '@/application/hooks/use-auth';
import { useMobileNavigation } from '@/presentation/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { roles } = useAuth();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
                {roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1 pb-1.5">
                        {roles.map((role) => (
                            <span
                                key={role}
                                className="rounded-md bg-neutral-200 px-1.5 py-0.5 text-xs font-medium capitalize text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
                            >
                                {role}
                            </span>
                        ))}
                    </div>
                )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href="/settings/profile" as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Configuración
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full" href={logout()} as="button" onClick={handleLogout}>
                    <LogOut className="mr-2" />
                    Cerrar sesión
                </Link>
            </DropdownMenuItem>
        </>
    );
}
