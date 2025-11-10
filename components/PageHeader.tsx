
import React from 'react';

interface PageHeaderProps {
    children: React.ReactNode;
    justify?: 'start' | 'end';
}

const PageHeader: React.FC<PageHeaderProps> = ({ children, justify = 'end' }) => {
    const justificationClass = justify === 'start' ? 'justify-start' : 'justify-end';
    
    return (
        <div className={`flex flex-col sm:flex-row ${justificationClass} items-center mb-8 gap-2`}>
            {children}
        </div>
    );
};

export default PageHeader;