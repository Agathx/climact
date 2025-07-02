'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleSignOut } from "@/app/auth/actions";
import { useSession, UserInfo } from "@/hooks/use-session";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { User, Settings, LogOut } from 'lucide-react';

function UserNavContent({ user }: { user: UserInfo }) {
  const roleNames = {
      cidadao: 'Cidadão',
      voluntario: 'Voluntário',
      ong: 'ONG',
      admin: 'Administrador',
      defesa_civil: 'Defesa Civil',
  }
  return (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {user.email}
          </p>
           <p className="text-xs leading-none text-muted-foreground pt-1 font-semibold">
            Perfil: {roleNames[user.role]}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <form action={handleSignOut} className="w-full">
        <DropdownMenuItem asChild>
          <button type="submit" className="w-full text-left">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </button>
        </DropdownMenuItem>
      </form>
    </>
  );
}

function UserNavLoading() {
  return (
     <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-2">
           <Skeleton className="h-4 w-32" />
           <Skeleton className="h-3 w-40" />
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem disabled>Meu Perfil</DropdownMenuItem>
        <DropdownMenuItem disabled>Configurações</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled>Sair</DropdownMenuItem>
    </>
  )
}

export function UserNav() {
  const { user, loading } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.photoURL || undefined} alt="Avatar do usuário" />
            <AvatarFallback><User /></AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
       {loading ? <UserNavLoading/> : (user ? <UserNavContent user={user} /> :  (
         <DropdownMenuItem>
            <Link href="/login">Fazer Login</Link>
         </DropdownMenuItem>
       ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
