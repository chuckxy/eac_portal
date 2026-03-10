'use client';

import React, { forwardRef, useImperativeHandle, useContext, useRef, useState } from 'react';

import AppBreadCrumb from './AppBreadCrumb';
import { LayoutContext } from './context/layoutcontext';
import { useAuth } from './context/authcontext';
import AppSidebar from './AppSidebar';
import { StyleClass } from 'primereact/styleclass';
import { Ripple } from 'primereact/ripple';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';

const roleSeverityMap: Record<string, 'success' | 'info' | 'warning'> = {
    admin: 'success',
    lecturer: 'info',
    student: 'warning'
};

const AppTopbar = forwardRef((props: { sidebarRef: React.RefObject<HTMLDivElement> }, ref) => {
    const [searchActive, setSearchActive] = useState(false);

    const btnRef1 = useRef(null);
    const menubutton = useRef(null);
    const menubuttonRef = useRef(null);
    const searchInput = useRef(null);
    const profileRef = useRef(null);
    const profileMenuRef = useRef(null);
    const logoutRef = useRef(null);

    const { onMenuToggle, showConfigSidebar, showSidebar, layoutConfig } = useContext(LayoutContext);
    const { user, logout } = useAuth();

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current
    }));

    const activateSearch = () => {
        setSearchActive(true);

        setTimeout(() => {
            (searchInput.current as any).focus();
        }, 1000);
    };
    const deactivateSearch = () => {
        setSearchActive(false);
    };

    const userInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U' : '?';
    const userDisplayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : '';

    return (
        <React.Fragment>
            <div className="layout-topbar">
                <div className="topbar-start">
                    <button ref={btnRef1} type="button" className="p-ripple topbar-menubutton p-link p-trigger" onClick={onMenuToggle}>
                        <i className="pi pi-bars"></i>
                        <Ripple />
                    </button>

                    <div className="topbar-breadcrumb">
                        <AppBreadCrumb></AppBreadCrumb>
                    </div>
                </div>
                <div className="layout-topbar-menu-section">
                    <AppSidebar sidebarRef={props.sidebarRef} />
                </div>
                <div className="topbar-end">
                    <ul className="topbar-menu">
                        <li className="hidden lg:block">
                            <div className={classNames('topbar-search', { 'topbar-search-active': searchActive })}>
                                <Button icon="pi pi-search" className="topbar-searchbutton p-button-text p-button-secondary text-color-secondary p-button-rounded flex-shrink-0" type="button" onClick={activateSearch}></Button>
                                <div className="search-input-wrapper">
                                    <span className="p-input-icon-right">
                                        <InputText
                                            ref={searchInput}
                                            type="text"
                                            placeholder="Search"
                                            onBlur={deactivateSearch}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') deactivateSearch();
                                            }}
                                        />
                                        <i className="pi pi-search"></i>
                                    </span>
                                </div>
                            </div>
                        </li>

                        <li className="ml-3">
                            <Button type="button" icon="pi pi-cog" className="p-button-text p-button-secondary text-color-secondary p-button-rounded flex-shrink-0" onClick={showConfigSidebar}></Button>
                        </li>

                        <li ref={profileMenuRef} className="profile-item topbar-item">
                            <StyleClass nodeRef={profileRef} selector="@next" enterClassName="hidden" enterActiveClassName="px-scalein" leaveToClassName="hidden" leaveActiveClassName="px-fadeout" hideOnOutsideClick>
                                <a className="p-ripple cursor-pointer" ref={profileRef}>
                                    <div className="border-circle flex align-items-center justify-content-center bg-primary text-white font-bold" style={{ width: '2.2rem', height: '2.2rem', fontSize: '0.9rem' }}>
                                        {userInitials}
                                    </div>
                                    <Ripple />
                                </a>
                            </StyleClass>

                            <ul className="topbar-menu active-topbar-menu p-4 w-17rem z-5 hidden border-round">
                                {user && (
                                    <li className="m-0 mb-3 pb-3 border-bottom-1 surface-border">
                                        <div className="flex align-items-center gap-2">
                                            <div className="border-circle flex align-items-center justify-content-center bg-primary text-white font-bold flex-shrink-0" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}>
                                                {userInitials}
                                            </div>
                                            <div className="flex flex-column">
                                                <span className="font-semibold text-sm">{userDisplayName}</span>
                                                <Tag value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} severity={roleSeverityMap[user.role] || 'info'} className="mt-1 w-min text-xs" />
                                            </div>
                                        </div>
                                    </li>
                                )}

                                <li role="menuitem" className="m-0 mb-3">
                                    <StyleClass nodeRef={menubutton} selector="@grandparent" enterClassName="hidden" enterActiveClassName="px-scalein" leaveToClassName="hidden" leaveActiveClassName="px-fadeout" hideOnOutsideClick>
                                        <a href="#" ref={menubutton} className="flex align-items-center hover:text-primary-500 transition-duration-200">
                                            <i className="pi pi-fw pi-user mr-2"></i>
                                            <span>My Profile</span>
                                        </a>
                                    </StyleClass>
                                </li>

                                <li role="menuitem" className="m-0 mb-3">
                                    <StyleClass nodeRef={menubuttonRef} selector="@grandparent" enterClassName="hidden" enterActiveClassName="px-scalein" leaveToClassName="hidden" leaveActiveClassName="px-fadeout" hideOnOutsideClick>
                                        <a href="#" ref={menubuttonRef} className="flex align-items-center hover:text-primary-500 transition-duration-200">
                                            <i className="pi pi-fw pi-cog mr-2"></i>
                                            <span>Settings</span>
                                        </a>
                                    </StyleClass>
                                </li>

                                <li role="menuitem" className="m-0 pt-3 border-top-1 surface-border">
                                    <a
                                        ref={logoutRef}
                                        className="flex align-items-center hover:text-primary-500 transition-duration-200 cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            logout();
                                        }}
                                    >
                                        <i className="pi pi-fw pi-sign-out mr-2"></i>
                                        <span>Logout</span>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <li className="right-panel-button relative hidden lg:block">
                            {/* <Button type="button" icon="pi pi-bookmark" className="layout-rightmenu-button block md:hidden font-normal" onClick={showSidebar}></Button> */}
                        </li>
                    </ul>
                </div>
            </div>
        </React.Fragment>
    );
});

export default AppTopbar;

AppTopbar.displayName = 'AppTopbar';
