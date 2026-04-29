import React, { useState, ReactNode } from 'react';
import {
  EllipsisVerticalIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
  EyeSlashIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface DashboardWidgetProps {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  refreshable?: boolean;
  configurable?: boolean;
  removable?: boolean;
  collapsible?: boolean;
  resizable?: boolean;
  size?: 'small' | 'medium' | 'large';
  onRefresh?: () => void;
  onConfigure?: () => void;
  onRemove?: () => void;
  onResize?: (size: 'small' | 'medium' | 'large') => void;
  lastUpdated?: Date;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  id,
  title,
  subtitle,
  children,
  className = '',
  loading = false,
  error,
  refreshable = false,
  configurable = false,
  removable = false,
  collapsible = false,
  resizable = false,
  size = 'medium',
  onRefresh,
  onConfigure,
  onRemove,
  onResize,
  lastUpdated,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const sizeOptions: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'large':
        return 'col-span-2 row-span-2';
      default:
        return 'col-span-1';
    }
  };

  const getHeightClass = () => {
    if (isCollapsed) return 'h-auto';

    // min-h instead of h: the widget keeps a baseline footprint but grows
    // to fit content. A hard h-* would let tall content overflow into the
    // next sibling because the outer box has no overflow-hidden.
    switch (size) {
      case 'small':
        return 'min-h-64';
      case 'large':
        return 'min-h-96';
      default:
        return 'min-h-80';
    }
  };

  return (
    <div
      data-widget-id={id}
      className={`bg-card rounded-card border border-border border-t-2 border-t-cta shadow-sm ${getSizeClasses()} ${getHeightClass()} ${className}`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate mt-1">{subtitle}</p>
          )}
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Widget Actions */}
        <div className="flex items-center gap-2 ml-4">
          {refreshable && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label={`Refresh ${title} widget`}
              className="p-1 text-muted-foreground hover:text-foreground rounded-control transition-colors disabled:animate-spin"
              title="Refresh"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          )}

          {/* Menu Dropdown */}
          {(configurable || removable || resizable || collapsible) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-haspopup="menu"
                aria-expanded={showMenu}
                aria-label={`Open ${title} widget options`}
                className="p-1 text-muted-foreground hover:text-foreground rounded-control transition-colors"
              >
                <EllipsisVerticalIcon className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  role="menu"
                  aria-label={`${title} widget options`}
                  className="absolute right-0 top-8 w-48 bg-card rounded-card shadow-lg border border-border py-1 z-50"
                >
                  {collapsible && (
                    <button
                      onClick={() => {
                        setIsCollapsed(!isCollapsed);
                        setShowMenu(false);
                      }}
                      role="menuitem"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      {isCollapsed ? (
                        <ArrowsPointingOutIcon className="w-4 h-4" />
                      ) : (
                        <ArrowsPointingInIcon className="w-4 h-4" />
                      )}
                      {isCollapsed ? 'Expand' : 'Collapse'}
                    </button>
                  )}

                  {resizable && (
                    <>
                      <div className="border-t border-border my-1"></div>
                      <div className="px-3 py-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Size</p>
                      </div>
                      {sizeOptions.map((sizeOption) => (
                        <button
                          key={sizeOption}
                          onClick={() => {
                            onResize?.(sizeOption);
                            setShowMenu(false);
                          }}
                          role="menuitem"
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm ${
                            size === sizeOption
                              ? 'text-primary bg-accent'
                              : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          <span className="capitalize">{sizeOption}</span>
                          {size === sizeOption && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </>
                  )}

                  {configurable && (
                    <>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => {
                          onConfigure?.();
                          setShowMenu(false);
                        }}
                        role="menuitem"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        Configure
                      </button>
                    </>
                  )}

                  {removable && (
                    <>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => {
                          onRemove?.();
                          setShowMenu(false);
                        }}
                        role="menuitem"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Remove
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && (
        <div className="p-4 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="text-red-500 mb-2">
                  <EyeSlashIcon className="w-8 h-8 mx-auto" />
                </div>
                <p className="text-sm text-red-600">{error}</p>
                {refreshable && (
                  <button
                    onClick={handleRefresh}
                    className="mt-2 text-sm text-primary hover:text-link-hover"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              {children}
            </div>
          )}
        </div>
      )}

      {/* Click outside handler */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default DashboardWidget;
