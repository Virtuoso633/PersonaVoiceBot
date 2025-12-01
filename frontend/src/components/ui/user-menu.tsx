import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const navigate = useNavigate();
  const username = "sanket"; // Mock username for now

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {username[0].toUpperCase()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200"
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          className="cursor-pointer focus:bg-zinc-800 focus:text-white"
          onClick={() => navigate(`/${username}`)}
        >
          <User className="mr-2 h-4 w-4" />
          <span>User Info</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-white text-red-400 focus:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
