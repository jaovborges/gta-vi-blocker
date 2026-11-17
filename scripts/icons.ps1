Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path icons | Out-Null
foreach ($size in @(16,32,48,128)) {
  $bmp = New-Object System.Drawing.Bitmap(256,256)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(12,16,23))
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush([System.Drawing.Point]::new(30,20),[System.Drawing.Point]::new(210,230),[System.Drawing.Color]::FromArgb(156,255,209),[System.Drawing.Color]::FromArgb(71,159,134))
  $points = @([System.Drawing.Point]::new(128,20),[System.Drawing.Point]::new(224,58),[System.Drawing.Point]::new(208,166),[System.Drawing.Point]::new(128,236),[System.Drawing.Point]::new(48,166),[System.Drawing.Point]::new(32,58))
  $g.FillPolygon($brush,$points)
  $font = New-Object System.Drawing.Font('Segoe UI',78,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
  $ink = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15,48,39))
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString('VI',$font,$ink,[System.Drawing.RectangleF]::new(12,35,232,170),$format)
  $small = New-Object System.Drawing.Bitmap($size,$size)
  $sg = [System.Drawing.Graphics]::FromImage($small)
  $sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $sg.DrawImage($bmp,0,0,$size,$size)
  $small.Save((Join-Path (Get-Location) "icons/icon$size.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  $sg.Dispose(); $small.Dispose(); $g.Dispose(); $bmp.Dispose(); $brush.Dispose(); $ink.Dispose(); $font.Dispose(); $format.Dispose()
}
