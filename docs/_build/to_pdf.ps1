# DOCX/PPTX файлдарын MS Office арқылы PDF-ке түрлендіреді (визуалды тексеру үшін).
param([string]$InFile, [string]$OutFile)
$ext = [IO.Path]::GetExtension($InFile).ToLower()
if ($ext -eq ".docx") {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  try {
    $doc = $word.Documents.Open($InFile, $false, $true)
    $doc.ExportAsFixedFormat($OutFile, 17)
    $doc.Close($false)
  } finally { $word.Quit() }
} elseif ($ext -eq ".pptx") {
  $ppt = New-Object -ComObject PowerPoint.Application
  try {
    $pres = $ppt.Presentations.Open($InFile, $true, $false, $false)
    $pres.SaveAs($OutFile, 32)
    $pres.Close()
  } finally { $ppt.Quit() }
}
