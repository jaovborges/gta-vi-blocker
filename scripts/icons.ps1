Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path icons | Out-Null
foreach ($size in @(16,32,48,128)) {
  $bmp = New-Object System.Drawing.Bitmap(256,256)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(23,15,37))
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush([System.Drawing.Point]::new(128,20),[System.Drawing.Point]::new(128,236),[System.Drawing.Color]::FromArgb(255,199,156),[System.Drawing.Color]::FromArgb(245,111,189))
  $points = @([System.Drawing.Point]::new(128,20),[System.Drawing.Point]::new(224,58),[System.Drawing.Point]::new(208,166),[System.Drawing.Point]::new(128,236),[System.Drawing.Point]::new(48,166),[System.Drawing.Point]::new(32,58))
  $g.FillPolygon($brush,$points)
  $outline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(117,233,223),4)
  $g.DrawLines($outline,@([System.Drawing.Point]::new(48,166),[System.Drawing.Point]::new(128,236),[System.Drawing.Point]::new(208,166)))
  $font = New-Object System.Drawing.Font('Segoe UI',78,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
  $ink = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(49,22,53))
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString('VI',$font,$ink,[System.Drawing.RectangleF]::new(12,35,232,170),$format)
  $small = New-Object System.Drawing.Bitmap($size,$size)
  $sg = [System.Drawing.Graphics]::FromImage($small)
  $sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $sg.DrawImage($bmp,0,0,$size,$size)
  $small.Save((Join-Path (Get-Location) "icons/icon$size.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  $sg.Dispose(); $small.Dispose(); $g.Dispose(); $bmp.Dispose(); $brush.Dispose(); $outline.Dispose(); $ink.Dispose(); $font.Dispose(); $format.Dispose()
}
