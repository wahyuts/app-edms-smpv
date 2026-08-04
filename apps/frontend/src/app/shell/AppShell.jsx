import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import navigation from "@/app/navigation";
import { AuthService } from "@/features/auth/services/auth.service";
import {
  useCurrentUserUnreadNotificationCount,
  useRealtimeNotificationSync,
} from "@/features/notification";
import ActiveProjectSelector from "@/features/project/components/ActiveProjectSelector";
import { useToast } from "@/shared/components/toast";
import { usePermission } from "@/shared/hooks/usePermission";
import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { useRealtimeClient } from "@/shared/realtime";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "edms.sidebar.collapsed";
const COLLAPSED_FLYOUT_GAP = 12;
const COLLAPSED_FLYOUT_VIEWPORT_MARGIN = 12;
const COLLAPSED_FLYOUT_WIDTH = 192;

const getInitialSidebarCollapsed = () => {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const AppShell = ({ children }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userMenuPathname, setUserMenuPathname] = useState(null);
  const [openMenuIds, setOpenMenuIds] = useState([]);
  const [collapsedFlyoutMenu, setCollapsedFlyoutMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => AuthService.getCurrentUser());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    getInitialSidebarCollapsed,
  );
  const collapsedFlyoutRef = useRef(null);
  const sidebarNavigationRef = useRef(null);
  const sidebarRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  useRealtimeClient();
  useRealtimeNotificationSync();
  const {
    activeOfficialRole,
    clearProjectContext,
    setProjectContext,
    setProjectContextLoading,
  } = useProjectContextStore();
  const { data: unreadNotificationCount = 0 } =
    useCurrentUserUnreadNotificationCount();
  const isUserMenuVisible =
    isUserMenuOpen && userMenuPathname === location.pathname;

  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false);
  }, []);

  useOutsideClick({
    enabled: isUserMenuVisible,
    onOutsideClick: closeUserMenu,
    ref: userMenuRef,
  });

  useEffect(() => {
    return AuthService.subscribeCurrentUserChange(setCurrentUser);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      clearProjectContext();
      return;
    }

    const activeProject = AuthService.getActiveProject();
    const accessibleProjects = AuthService.getAccessibleProjects();
    const activeMembership = AuthService.getActiveMembership();

    setProjectContextLoading(true);
    setProjectContext({
      accessibleProjects,
      activeMembership,
      activeProject,
    });
  }, [
    clearProjectContext,
    currentUser,
    setProjectContext,
    setProjectContextLoading,
  ]);

  const authorizedNavigation = useMemo(
    () =>
      navigation
        .map((item) => {
          const authorizedChildren = item.children?.filter((childItem) =>
            hasPermission(childItem.permission),
          );

          if (item.children) {
            return hasPermission(item.permission) && authorizedChildren.length > 0
              ? { ...item, children: authorizedChildren }
              : null;
          }

          return hasPermission(item.permission) ? item : null;
        })
        .filter(Boolean),
    [hasPermission],
  );
  const collapsedFlyoutItem = useMemo(
    () =>
      authorizedNavigation.find(
        (item) => item.id === collapsedFlyoutMenu?.menuId,
      ),
    [authorizedNavigation, collapsedFlyoutMenu?.menuId],
  );

  const closeCollapsedFlyout = useCallback(() => {
    setCollapsedFlyoutMenu(null);
  }, []);

  const getCollapsedFlyoutPosition = useCallback((triggerElement, childCount) => {
    const triggerRect = triggerElement.getBoundingClientRect();
    const sidebarRight =
      sidebarRef.current?.getBoundingClientRect().right ?? triggerRect.right;
    const estimatedHeight = 48 + childCount * 38;
    const minTop = COLLAPSED_FLYOUT_VIEWPORT_MARGIN;
    const maxTop = Math.max(
      minTop,
      window.innerHeight - estimatedHeight - COLLAPSED_FLYOUT_VIEWPORT_MARGIN,
    );
    const top = Math.min(Math.max(triggerRect.top, minTop), maxTop);
    const preferredLeft = sidebarRight + COLLAPSED_FLYOUT_GAP;
    const maxLeft = Math.max(
      COLLAPSED_FLYOUT_VIEWPORT_MARGIN,
      window.innerWidth -
        COLLAPSED_FLYOUT_WIDTH -
        COLLAPSED_FLYOUT_VIEWPORT_MARGIN,
    );
    const left = Math.min(preferredLeft, maxLeft);
    const maxHeight = Math.max(
      120,
      window.innerHeight - top - COLLAPSED_FLYOUT_VIEWPORT_MARGIN,
    );

    return { left, maxHeight, top };
  }, []);

  const toggleCollapsedFlyout = useCallback(
    (item, event) => {
      if (!isSidebarCollapsed) return;

      event.stopPropagation();

      const position = getCollapsedFlyoutPosition(
        event.currentTarget,
        item.children.length,
      );

      setCollapsedFlyoutMenu((currentFlyoutMenu) =>
        currentFlyoutMenu?.menuId === item.id
          ? null
          : {
              menuId: item.id,
              ...position,
            },
      );
    },
    [getCollapsedFlyoutPosition, isSidebarCollapsed],
  );

  const toggleMenu = (menuId) => {
    if (isSidebarCollapsed) return;

    setOpenMenuIds((currentOpenMenuIds) =>
      currentOpenMenuIds.includes(menuId)
        ? currentOpenMenuIds.filter((openMenuId) => openMenuId !== menuId)
        : [...currentOpenMenuIds, menuId],
    );
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(closeCollapsedFlyout, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [closeCollapsedFlyout, location.pathname]);

  useEffect(() => {
    if (!collapsedFlyoutMenu) return undefined;

    const handlePointerDown = (event) => {
      if (
        collapsedFlyoutRef.current?.contains(event.target) ||
        sidebarNavigationRef.current?.contains(event.target)
      ) {
        return;
      }

      closeCollapsedFlyout();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeCollapsedFlyout();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeCollapsedFlyout, collapsedFlyoutMenu]);

  const toggleSidebar = () => {
    const nextValue = !isSidebarCollapsed;

    if (!nextValue) closeCollapsedFlyout();

    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(nextValue),
      );
    } catch {
      // UI preference persistence is non-critical; keep the interaction working.
    }
    setIsSidebarCollapsed(nextValue);
  };

  const handleLogout = async () => {
    const response = await AuthService.logout();
    clearProjectContext();
    setIsUserMenuOpen(false);
    showToast({
      message: response.message,
      variant: response.success ? "success" : "error",
    });
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#020B16] text-[#F8FAFC]">
      <aside
        ref={sidebarRef}
        className={[
          "flex h-screen min-h-0 shrink-0 flex-col overflow-visible border-r border-[#123A5A] bg-[#031528] transition-[width] duration-200",
          isSidebarCollapsed ? "w-20" : "w-64",
        ].join(" ")}
      >
        <div
          className={[
            "flex h-[5.5rem] shrink-0 flex-col justify-center border-b border-[#123A5A]",
            isSidebarCollapsed ? "px-3 text-center" : "px-6",
          ].join(" ")}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0F7BFF]">
            APP
          </p>
          <p
            className={[
              "font-extrabold leading-none text-white",
              isSidebarCollapsed ? "text-lg" : "text-[2rem]",
            ].join(" ")}
          >
            {isSidebarCollapsed ? "ED" : "EDMS"}
          </p>
        </div>

        <nav
          ref={sidebarNavigationRef}
          onScroll={closeCollapsedFlyout}
          className={[
            "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain py-6 [scrollbar-color:#123A5A_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#123A5A] [&::-webkit-scrollbar-track]:bg-transparent",
            isSidebarCollapsed ? "items-center px-3" : "px-4",
          ].join(" ")}
        >
          {authorizedNavigation.map((item) => {
              const Icon = item.icon;
              const isParentActive = item.children?.some((childItem) =>
                location.pathname.startsWith(childItem.path),
              );
              const isOpen = isParentActive || openMenuIds.includes(item.id);

              if (item.children) {
                return (
                  <div
                    key={item.id}
                    className={[
                      "group relative flex flex-col gap-1",
                      isSidebarCollapsed ? "w-full items-center" : "",
                    ].join(" ")}
                  >
                    <button
                      aria-label={item.title}
                      aria-expanded={
                        isSidebarCollapsed
                          ? collapsedFlyoutMenu?.menuId === item.id
                          : isOpen
                      }
                      aria-haspopup={isSidebarCollapsed ? "menu" : undefined}
                      title={isSidebarCollapsed ? item.title : undefined}
                      className={[
                        "flex items-center rounded-lg text-left text-[14px] font-medium transition-colors",
                        isSidebarCollapsed
                          ? "h-11 w-11 justify-center"
                          : "w-full gap-2.5 px-4 py-2.5",
                        isParentActive
                          ? "bg-[#0B2B47] text-white"
                          : "text-[#CBD5E1] hover:bg-[#0B2B47] hover:text-white",
                      ].join(" ")}
                      onClick={(event) => {
                        if (isSidebarCollapsed) {
                          toggleCollapsedFlyout(item, event);
                          return;
                        }

                        toggleMenu(item.id);
                      }}
                      type="button"
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isSidebarCollapsed ? (
                        <>
                          <span className="min-w-0 flex-1">{item.title}</span>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                          )}
                        </>
                      ) : null}
                    </button>

                    {!isSidebarCollapsed && isOpen ? (
                      <div className="ml-4 flex flex-col gap-1 border-l border-[#123A5A] pl-3">
                        {item.children.map((childItem) => {
                          const ChildIcon = childItem.icon;

                          return (
                            <NavLink
                              key={childItem.id}
                              to={childItem.path}
                              className={({ isActive }) =>
                                [
                                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                                  isActive
                                    ? "bg-[#0F7BFF] text-white hover:bg-[#133B5F]"
                                    : "text-[#CBD5E1] hover:bg-[#0B2B47] hover:text-white",
                                ].join(" ")
                              }
                            >
                              <ChildIcon className="h-4 w-4 shrink-0" />
                              <span>{childItem.title}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }
          
                  return (
                      <NavLink
                          key={item.id}
                          onClick={closeCollapsedFlyout}
                          to={item.path}
                          title={isSidebarCollapsed ? item.title : undefined}
                          className={({ isActive }) =>
                              [
                                  "group relative flex items-center rounded-lg text-[14px] font-medium transition-colors",
                                  isSidebarCollapsed
                                    ? "h-11 w-11 justify-center"
                                    : "w-full gap-2.5 px-4 py-2.5",
                                      isActive
                                            ? "bg-[#0F7BFF] hover:bg-[#133B5F] text-white"
                                            : "text-[#CBD5E1] hover:bg-[#0B2B47] hover:text-white",
                              ].join(" ")
                          }
                        >
                                <Icon className="h-5 w-5 shrink-0" />
          
                          {!isSidebarCollapsed ? <span>{item.title}</span> : null}
                      </NavLink>
                  );
              })}
        </nav>

        {isSidebarCollapsed && collapsedFlyoutMenu && collapsedFlyoutItem ? (
          <div
            ref={collapsedFlyoutRef}
            className="fixed z-[8700] overflow-y-auto overflow-x-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] py-2 shadow-lg [scrollbar-color:#123A5A_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#123A5A] [&::-webkit-scrollbar-track]:bg-transparent"
            style={{
              left: collapsedFlyoutMenu.left,
              maxHeight: collapsedFlyoutMenu.maxHeight,
              top: collapsedFlyoutMenu.top,
              width: COLLAPSED_FLYOUT_WIDTH,
            }}
          >
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
              {collapsedFlyoutItem.title}
            </p>
            {collapsedFlyoutItem.children.map((childItem) => {
              const ChildIcon = childItem.icon;

              return (
                <NavLink
                  key={childItem.id}
                  to={childItem.path}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-[#0F7BFF] text-white"
                        : "text-[#CBD5E1] hover:bg-[#0B2B47] hover:text-white",
                    ].join(" ")
                  }
                  onClick={closeCollapsedFlyout}
                >
                  <ChildIcon className="h-4 w-4 shrink-0" />
                  <span>{childItem.title}</span>
                </NavLink>
              );
            })}
          </div>
        ) : null}

        <div
          className={[
            "shrink-0 py-3",
            isSidebarCollapsed ? "px-3" : "px-4",
          ].join(" ")}
        >
          <button
            aria-label="Logout"
            className={[
              "group relative flex items-center rounded-lg text-[14px] font-medium text-[#CBD5E1] transition-colors hover:bg-[#0B2B47] hover:text-[#EF4444] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF] focus:ring-offset-2 focus:ring-offset-[#031528]",
              isSidebarCollapsed
                ? "h-11 w-11 justify-center"
                : "w-full gap-2.5 px-4 py-2.5 text-left",
            ].join(" ")}
            onClick={() => {
              closeCollapsedFlyout();
              handleLogout();
            }}
            title={isSidebarCollapsed ? "Logout" : undefined}
            type="button"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!isSidebarCollapsed ? <span>Logout</span> : null}
            {isSidebarCollapsed ? (
              <span
                className="pointer-events-none absolute left-[calc(100%+0.75rem)] top-1/2 z-[8800] -translate-y-1/2 whitespace-nowrap rounded-md border border-[#123A5A] bg-[#061B2F] px-2.5 py-1.5 text-xs font-semibold text-[#F8FAFC] opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                role="tooltip"
              >
                Logout
              </span>
            ) : null}
          </button>
        </div>

        <button
          aria-label={isSidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
          className={[
            "flex shrink-0 items-center border-t border-[#123A5A] text-[14px] text-[#94A3B8] transition-all hover:bg-[#123A5A] hover:text-white",
            isSidebarCollapsed
              ? "justify-center px-0 py-4"
              : "gap-2 px-6 py-4",
          ].join(" ")}
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Expand Menu" : undefined}
          type="button"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse Menu</span>
            </>
          )}
        </button>
      </aside>

      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <header className="relative z-[8000] flex h-[5.5rem] shrink-0 items-center justify-between gap-4 overflow-visible border-b border-[#123A5A] bg-[#020B16] px-6 py-4">
          <div className="min-w-0 shrink">
            <p className="text-sm font-medium uppercase tracking-wide text-[#0F7BFF]">
              APP Engineering
            </p>
            <p className="truncate text-lg font-semibold">
              Engineering Document Management System
            </p>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-3 text-sm">
            <ActiveProjectSelector />
            <div className="relative z-[8500]" ref={userMenuRef}>
              <button
                aria-expanded={isUserMenuVisible}
                aria-haspopup="menu"
                className="flex min-h-14 w-[clamp(11rem,18vw,16rem)] max-w-[16rem] items-center gap-2 rounded-lg border border-[#123A5A] bg-[#061B2F] px-3 py-2 text-left transition-colors hover:bg-[#123A5A] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF] focus:ring-offset-2 focus:ring-offset-[#020B16]"
                onClick={() => {
                  setUserMenuPathname(location.pathname);
                  setIsUserMenuOpen((isOpen) =>
                    isOpen && userMenuPathname === location.pathname
                      ? false
                      : true,
                  );
                }}
                title={`${currentUser?.fullName ?? "User"} - Role: ${activeOfficialRole ?? "-"}`}
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold leading-4 text-[#F8FAFC]">
                    {currentUser?.fullName ?? "User"}
                  </span>
                  <span className="mt-1 block truncate text-xs font-medium leading-3 text-[#94A3B8]">
                    Role: {activeOfficialRole ?? "-"}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden="true" />
              </button>

              {isUserMenuVisible ? (
                <div className="absolute right-0 z-[8500] mt-2 w-48 overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-lg" role="menu">
                  {hasPermission("user-management.view") ? (
                    <Link
                      className="block px-4 py-2 text-[#CBD5E1] transition-colors hover:bg-[#0B2B47] hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                      to="/user-management"
                    >
                      User Management
                    </Link>
                  ) : null}
                  {hasPermission("profile.view") ? (
                    <Link
                      className="block px-4 py-2 text-[#CBD5E1] transition-colors hover:bg-[#0B2B47] hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                      to="/profile"
                    >
                      My Profile
                    </Link>
                  ) : null}
                  {hasPermission("password.change") ? (
                    <Link
                      className="block px-4 py-2 text-[#CBD5E1] transition-colors hover:bg-[#0B2B47] hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                      to="/change-password"
                    >
                      Change Password
                    </Link>
                  ) : null}
                  <div className="my-1 border-t border-[#123A5A]" />
                  <button
                    className="block w-full px-4 py-2 text-left text-[#CBD5E1] transition-colors hover:bg-[#0B2B47] hover:text-white"
                    onClick={handleLogout}
                    type="button"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
            {hasPermission("notifications.view") ? (
              <Link
                aria-label={`Open Notification${unreadNotificationCount > 0 ? `. ${unreadNotificationCount} unread.` : ""}`}
                className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#123A5A] bg-[#061B2F] text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#123A5A] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#0F7BFF] focus:ring-offset-2 focus:ring-offset-[#020B16]"
                title="Open Notification"
                to="/notifications"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadNotificationCount > 0 ? (
                  <span
                    aria-label={`${unreadNotificationCount} unread notifications`}
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E11D48] px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-[#020B16]"
                  >
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                ) : null}
              </Link>
            ) : null}
          </div>
        </header>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {children}
          <footer className="border-t border-[#123A5A] bg-[#020B16] px-6 py-5 text-center text-sm text-[#94A3B8]">
              <p>© 2026 APP Engineering EDMS</p>
              <p>All Rights Reserved</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
