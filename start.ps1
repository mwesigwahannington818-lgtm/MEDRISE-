$env:PORT = '4173'
$env:BASE_PATH = '/'
Set-Location "$PSScriptRoot\artifacts\medrise"
pnpm run dev
