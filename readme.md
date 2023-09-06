
## URL

https://github.com/n0bisuke/futsal

## インストール
```
curl -fsSL https://deno.land/x/install/install.sh | sh
```



```
{
  "name": "@ubuntu",
  "image": "denoland/deno:ubuntu",
  "forwardPorts": [8000],
  "settings": {
    "terminal.integrated.shell.linux": "/bin/bash"
  },
  "extensions": [
    "denoland.vscode-deno"
  ]
}
```

## アルゴリズムメモ

毎時更新 
t1 = H + (H + 1)
t2 = H + (H + 2)

- 0時: 0+1, 0+2 = 1,2
- 1時: 1+2, 1+3 = 3,4
- 2時: 2+3, 2+4 = 5,6
・
・
・
- 23時: 23+24, 23+25 = 47,48

**これで毎時間実行で1~50日後までを取得できる。**

既出バグ: このアルゴリズムだと0日後(当日)の更新ができない

