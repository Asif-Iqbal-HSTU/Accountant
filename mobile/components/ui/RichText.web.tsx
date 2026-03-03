import React, { forwardRef } from 'react';
import { TextInput, View, Text } from 'react-native';

export const RichEditor = forwardRef((props: any, ref) => {
    return (
        <TextInput 
            {...props} 
            ref={ref as any} 
            multiline 
            style={[{ flex: 1, minHeight: 50, padding: 10 }, props.style]} 
        />
    );
});

export const RichToolbar = () => <View />;

export const actions = {
    setBold: 'setBold',
    setItalic: 'setItalic',
    setUnderline: 'setUnderline',
    insertLink: 'insertLink',
    insertBulletsList: 'insertBulletsList',
    insertOrderedList: 'insertOrderedList',
};
