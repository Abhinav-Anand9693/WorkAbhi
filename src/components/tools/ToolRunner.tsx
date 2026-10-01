"use client";

import type { Tool } from "@/types/tool";
import CalculatorTool from "@/components/calculator/CalculatorTool";
import ImageTool from "@/components/image/ImageTool";
import DeveloperTool from "@/components/developer/DeveloperTool";
import QRTool from "@/components/qr/QRTool";
import ColorTool from "@/components/color/ColorTool";
import TextTool from "../text/TextTool";
import AudioTool from "../audio/AudioTool";
import VideoTool from "../video/VideoTool";
import FileDataTool from "../data/DataTool";
import PDFTool from "@/components/pdf/PDFTool";

interface ToolRunnerProps {
  tool: Tool;
}

export default function ToolRunner({
  tool,
}: ToolRunnerProps) {
  switch (tool.type) {
    case "calculator":
      return <CalculatorTool toolId={tool.id} />;

    case "image":
      return <ImageTool toolId={tool.id} />;

    case "developer":
      return <DeveloperTool toolId={tool.id} />;
      
     case "qr":
      return <QRTool toolId={tool.id}
       />;

    case "color":
      return <ColorTool toolId={tool.id} />;

      case "text":
  return <TextTool toolId={tool.id} />;

  case "video":
  return <VideoTool toolId={tool.id} />;

  case "audio":
  return <AudioTool toolId={tool.id} />;

  case "file-data":
  return <FileDataTool toolId={tool.id} />;

  case "pdf":
  return <PDFTool toolId={tool.id} />;


    default:
      return (
        <div className="rounded-2xl border p-8 text-center">
          <h2 className="text-xl font-semibold">
            {tool.name}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            This tool is registered and will be implemented
            in the next development phase.
          </p>
        </div>
      );
  }
}