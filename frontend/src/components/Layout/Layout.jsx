import React from 'react';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="layout">
        <Header />
        <Sidebar />
                <main className="layout-content">
                    {children}
                </main>
        </div>
    );
};

export default Layout;