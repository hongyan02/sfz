// 引入 antd v5 的 React 19 兼容补丁，必须放在最前面
import "@ant-design/v5-patch-for-react-19";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider } from "antd";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "CellCode",
    description: "基于 Next.js、Antd 和 Zustand 的应用",
};

export default function RootLayout({ children }) {
    return (
        <html lang="zh-CN">
            <ConfigProvider
                theme={{
                    components: {
                        Table: {
                            borderColor: "#000000",
                            headerBorderRadius: 0,
                            cellPaddingBlock: 8,
                            cellPaddingInline: 12,
                            headerBg: "#fafafa",
                            headerColor: "#374151",
                            rowHoverBg: "#f9fafb",
                            borderRadiusOuter: 6,
                        },
                        Card: {
                            headerBg: "#f9fafb",
                            bodyPadding: 0,
                        },
                    },
                    token: {
                        colorBorder: "#000000",
                        colorSplit: "#000000",
                    },
                }}
            >
                <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                    {children}
                </body>
            </ConfigProvider>
        </html>
    );
}
