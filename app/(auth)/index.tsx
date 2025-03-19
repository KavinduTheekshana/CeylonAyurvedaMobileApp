import React from 'react'
import { Redirect } from 'expo-router'

export default function AuthScreens() {
    return (
        <Redirect href="/register" />
    )
}