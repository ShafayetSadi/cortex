import { motion } from "framer-motion";
import { LayoutDashboard, Settings, Shield, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuGroups = {
  admin: [
    {
      title: "Overview",
      items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Workspace",
      items: [
        { to: "/users", label: "Team Management", icon: Users },
        { to: "/workspace", label: "Workspace Settings", icon: Settings },
      ],
    },
    {
      title: "Account",
      items: [{ to: "/profile", label: "Profile", icon: Shield }],
    },
  ],
  user: [
    {
      title: "Overview",
      items: [
        { to: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Account",
      items: [{ to: "/profile", label: "Profile", icon: Shield }],
    },
  ],
};

const Sidebar = ({ open, onClose }) => {
  const { user, workspace } = useAuth();
  if (!user) return null;
  const groups = menuGroups[user.role] ?? menuGroups.user;

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={[
          "fixed inset-y-14 left-0 z-40 w-60 border-r border-border bg-background",
          "flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        ].join(" ")}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-1 flex-col overflow-y-auto p-4"
        >
          {/* Workspace label */}
          <div className="mb-6 pb-4 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
            <p className="mt-1.5 font-heading text-base font-semibold text-foreground">
              {workspace?.name || "Cortex"}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground capitalize">
              {user.name} · {user.role}
            </p>
          </div>

          <nav className="flex flex-col gap-5">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors duration-150",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          ].join(" ")
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </motion.div>

        {/* User info at bottom */}
        <div className="border-t border-border p-4">
          <p className="text-xs font-medium text-foreground truncate">
            {user.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
