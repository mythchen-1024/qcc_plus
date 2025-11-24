import { useState } from 'react'
import { Html } from '@react-three/drei'
import MonacoEditor from '@monaco-editor/react'

export function Terminal3D() {
    const [code, setCode] = useState(`# 启动 QCC Plus
docker-compose up -d

# 测试连接
curl http://localhost:8000/v1/messages \\
  -H "x-api-key: your-key" \\
  -d '{
    "model": "claude-sonnet-4-5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`)

    const [output, setOutput] = useState('')

    const runCode = async () => {
        // 模拟执行
        setOutput('✓ 服务启动中...\n✓ 就绪端口 :8000\n> 发送请求...\n> 收到响应 (200 OK)\n> "你好！今天有什么可以帮你的吗？"')
    }

    return (
        <Html
            transform
            distanceFactor={5}
            position={[0, 0, 0]}
            style={{
                width: '800px',
                height: '600px',
                background: 'rgba(10, 10, 15, 0.95)',
                border: '1px solid rgba(0, 212, 255, 0.5)',
                borderRadius: '12px',
                boxShadow: '0 0 50px rgba(0, 212, 255, 0.3)',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
            }}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '20px'
            }}>
                {/* 编辑器 */}
                <div style={{ flex: 1, marginBottom: '20px' }}>
                    <MonacoEditor
                        language="shell"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'off',
                            scrollBeyondLastLine: false,
                            fontFamily: 'JetBrains Mono, monospace',
                            automaticLayout: true,
                            padding: { top: 16, bottom: 16 }
                        }}
                    />
                </div>

                {/* 运行按钮 */}
                <button
                    onClick={runCode}
                    style={{
                        background: 'linear-gradient(135deg, #00d4ff, #b400ff)',
                        border: 'none',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginBottom: '20px'
                    }}
                >
                    ▶ 运行代码
                </button>

                {/* 输出 */}
                <div style={{
                    background: '#000',
                    color: '#00ff88',
                    padding: '16px',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    minHeight: '100px'
                }}>
                    {output}
                </div>
            </div>
        </Html>
    )
}
