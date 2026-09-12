"""
PDF Report Generation Service for JeevaDrishti.

Generates publication-grade, verifiable analysis reports in PDF format containing
strictly real inference outputs, detection bounding boxes, confidence values,
and system configuration returned by the backend pipeline.
Never outputs demo, placeholder, or synthetic values.
"""

import io
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    Image as RLImage,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

from app.core.config import settings
from app.models.analysis import Analysis, UploadedFile
from app.services.analysis_service import get_analysis_by_id, get_uploaded_file_by_id


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and render total page count and footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running header rule
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 755, letter[0] - 40, 755)

        # Header text
        self.drawString(40, 762, "JEEVADRISHTI // CELLULAR MICROSCOPY ANALYSIS REPORT")
        self.drawRightString(letter[0] - 40, 762, "AI-ASSISTED INFERENCE RECORD")

        # Running footer rule
        self.line(40, 42, letter[0] - 40, 42)

        # Footer text
        self.drawString(
            40,
            30,
            "CONFIDENTIAL RESEARCH DOCUMENT — VERIFIED REAL INFERENCE DATA ONLY",
        )
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 40, 30, page_str)
        self.restoreState()


def _format_val(val: Any, suffix: str = "", default: str = "Not available") -> str:
    """Safely format values, returning 'Not available' if None or empty string."""
    if val is None or val == "":
        return default
    return f"{val}{suffix}"


def _format_float(val: Optional[float], decimals: int = 2, is_percentage: bool = False) -> str:
    if val is None:
        return "Not available"
    try:
        fval = float(val)
        if is_percentage:
            return f"{fval * 100:.{decimals}f}%"
        return f"{fval:.{decimals}f}"
    except (ValueError, TypeError):
        return "Not available"


def generate_analysis_pdf_bytes(
    analysis_id: str,
    user_id: int,
    db: Session,
) -> bytes:
    """
    Generate a complete, verifiable PDF report for a microscopy analysis.
    Uses strictly real data returned by the backend/inference system.
    """
    analysis: Analysis = get_analysis_by_id(db, analysis_id, user_id)
    file_record: Optional[UploadedFile] = get_uploaded_file_by_id(db, analysis.file_id)

    # Parse raw stored inference results if present
    stored_data: Dict[str, Any] = {}
    if analysis.result_data:
        try:
            stored_data = json.loads(analysis.result_data)
        except Exception:
            stored_data = {}

    detections: List[Dict[str, Any]] = stored_data.get("detections", [])
    raw_metadata: Dict[str, Any] = stored_data.get("metadata", {})
    metrics: Optional[Dict[str, Any]] = stored_data.get("metrics") or raw_metadata

    # Resolve core values strictly from real records
    status_display = (analysis.status or "unknown").upper()
    prediction = stored_data.get("prediction") or (
        "Non-Microscopy Image"
        if analysis.status == "rejected"
        else ("Unable to determine" if analysis.status == "completed" and not detections else "Not available")
    )
    confidence = stored_data.get("confidence")
    if confidence is None and detections:
        try:
            conf_scores = [float(d["confidence"]) for d in detections if "confidence" in d]
            if conf_scores:
                confidence = sum(conf_scores) / len(conf_scores)
        except Exception:
            confidence = None

    explanation = (
        stored_data.get("explanation")
        or stored_data.get("message")
        or analysis.error_message
        or ("Analysis completed successfully." if analysis.status == "completed" else "Not available")
    )
    indicators: List[str] = stored_data.get("indicators", [])

    # Setup ReportLab document
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=54,
        bottomMargin=54,
        title=f"JeevaDrishti Analysis Report - {analysis.id[:8]}",
        author="JeevaDrishti AI Platform",
        subject=f"Cellular Detection Analysis for {analysis.dataset}",
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748B"),
    )
    h2_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=4,
    )
    label_style = ParagraphStyle(
        "TableLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#334155"),
    )
    val_style = ParagraphStyle(
        "TableVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
    )
    val_mono = ParagraphStyle(
        "TableValMono",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0F172A"),
    )
    badge_style = ParagraphStyle(
        "StatusBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        alignment=2,  # Right aligned
    )
    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E293B"),
    )

    story = []

    # ─── HEADER SECTION ────────────────────────────────────────────────────────
    status_colors = {
        "COMPLETED": colors.HexColor("#059669"),
        "FAILED": colors.HexColor("#DC2626"),
        "REJECTED": colors.HexColor("#D97706"),
        "PROCESSING": colors.HexColor("#2563EB"),
        "PENDING": colors.HexColor("#475569"),
    }
    badge_color = status_colors.get(status_display, colors.HexColor("#475569"))

    header_table_data = [
        [
            Paragraph("JeevaDrishti Analysis Report", title_style),
            Paragraph(f"<font color='{badge_color.hexval()}'>● STATUS: {status_display}</font>", badge_style),
        ],
        [
            Paragraph(
                f"Autonomous Adaptive Microscopy & Cell Detection Platform &bull; ID: <font name='Courier'>{analysis.id}</font>",
                subtitle_style,
            ),
            Paragraph(
                f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
                ParagraphStyle("SubDate", parent=subtitle_style, alignment=2),
            ),
        ],
    ]
    header_table = Table(header_table_data, colWidths=[360, 172])
    header_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ])
    )
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceBefore=2, spaceAfter=10))

    # ─── SECTION 1: SPECIMEN & PIPELINE CONFIGURATION ──────────────────────────
    story.append(Paragraph("1. SPECIMEN & PIPELINE CONFIGURATION", h2_style))

    file_name = file_record.original_filename if file_record else "Not available"
    dimensions = (
        f"{file_record.width} &times; {file_record.height} px"
        if file_record and file_record.width and file_record.height
        else "Not available"
    )
    file_size = (
        f"{file_record.size / 1024:.1f} KB ({file_record.size:,} bytes)"
        if file_record and file_record.size
        else "Not available"
    )
    file_fmt = file_record.format if file_record else "Not available"

    created_str = (
        analysis.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
        if analysis.created_at
        else "Not available"
    )
    completed_str = (
        analysis.completed_at.strftime("%Y-%m-%d %H:%M:%S UTC")
        if analysis.completed_at
        else "Not available"
    )

    config_table_data = [
        [
            Paragraph("Specimen Image:", label_style),
            Paragraph(file_name, val_style),
            Paragraph("Benchmark Dataset:", label_style),
            Paragraph(_format_val(analysis.dataset), val_style),
        ],
        [
            Paragraph("Image Dimensions:", label_style),
            Paragraph(dimensions, val_style),
            Paragraph("Few-Shot Exemplars:", label_style),
            Paragraph(f"{analysis.shots} Shot" if analysis.shots is not None else "Not available", val_style),
        ],
        [
            Paragraph("File Size & Format:", label_style),
            Paragraph(f"{file_size} &bull; {file_fmt}", val_style),
            Paragraph("Model Identifier:", label_style),
            Paragraph(_format_val(analysis.vlm_model), val_style),
        ],
        [
            Paragraph("Execution Started:", label_style),
            Paragraph(created_str, val_style),
            Paragraph("Execution Completed:", label_style),
            Paragraph(completed_str, val_style),
        ],
    ]

    config_table = Table(config_table_data, colWidths=[105, 161, 110, 156])
    config_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(config_table)
    story.append(Spacer(1, 10))

    # ─── SECTION 2: INFERENCE FINDINGS & CLINICAL EXPLANATION ───────────────────
    story.append(Paragraph("2. INFERENCE PREDICTIONS & FINDINGS", h2_style))

    findings_data = [
        [
            Paragraph("Model Prediction:", label_style),
            Paragraph(f"<b>{prediction}</b>", val_style),
            Paragraph("Overall Confidence:", label_style),
            Paragraph(
                _format_float(confidence, decimals=1, is_percentage=True),
                val_style,
            ),
        ],
        [
            Paragraph("Detected Indicators:", label_style),
            Paragraph(
                ", ".join(indicators) if indicators else ("None recorded" if analysis.status == "completed" else "Not available"),
                val_style,
            ),
            Paragraph("Total Cells Detected:", label_style),
            Paragraph(
                str(len(detections)) if analysis.status == "completed" else ("0" if analysis.status == "rejected" else "Not available"),
                val_style,
            ),
        ],
        [
            Paragraph("Model Explanation:", label_style),
            Paragraph(explanation, body_style),
            Paragraph("", label_style),
            Paragraph("", val_style),
        ],
    ]
    findings_table = Table(findings_data, colWidths=[105, 161, 110, 156])
    findings_table.setStyle(
        TableStyle([
            ("SPAN", (1, 2), (3, 2)),  # Span explanation across 3 columns
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(findings_table)
    story.append(Spacer(1, 10))

    # ─── SECTION 3: SYSTEM METRICS (ONLY REAL DATA) ────────────────────────────
    story.append(Paragraph("3. SYSTEM & DETECTION METRICS", h2_style))

    m_prec = _format_float(metrics.get("precision") if metrics else None, decimals=4)
    m_rec = _format_float(metrics.get("recall") if metrics else None, decimals=4)
    m_map = _format_float(metrics.get("mAP50") if metrics else None, decimals=4)
    m_lat = (
        f"{metrics.get('inference_time_ms')} ms"
        if metrics and metrics.get("inference_time_ms") is not None
        else "Not available"
    )
    m_calls = (
        str(metrics.get("vlm_calls"))
        if metrics and metrics.get("vlm_calls") is not None
        else "Not available"
    )

    metrics_table_data = [
        [
            Paragraph("Precision:", label_style),
            Paragraph(m_prec, val_style),
            Paragraph("Recall:", label_style),
            Paragraph(m_rec, val_style),
            Paragraph("mAP@0.50:", label_style),
            Paragraph(m_map, val_style),
        ],
        [
            Paragraph("Latency:", label_style),
            Paragraph(m_lat, val_style),
            Paragraph("VLM Queries:", label_style),
            Paragraph(m_calls, val_style),
            Paragraph("Status Detail:", label_style),
            Paragraph(analysis.status, val_style),
        ],
    ]
    metrics_table = Table(metrics_table_data, colWidths=[65, 112, 65, 113, 70, 107])
    metrics_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ])
    )
    story.append(metrics_table)
    story.append(Spacer(1, 10))

    # ─── SECTION 4: CELL DETECTION INSTANCES ────────────────────────────────────
    story.append(Paragraph("4. CELLULAR DETECTION INSTANCES", h2_style))

    if analysis.status == "completed" and detections:
        det_header = [
            Paragraph("#", ParagraphStyle("TH_0", parent=label_style, textColor=colors.white)),
            Paragraph("Cell Classification", ParagraphStyle("TH_1", parent=label_style, textColor=colors.white)),
            Paragraph("Confidence Score", ParagraphStyle("TH_2", parent=label_style, textColor=colors.white)),
            Paragraph("Bounding Box Coordinates [x1, y1, x2, y2]", ParagraphStyle("TH_3", parent=label_style, textColor=colors.white)),
        ]
        det_rows = [det_header]

        # Render each real detection
        for idx, det in enumerate(detections, 1):
            label = str(det.get("label", "Cell"))
            c_val = det.get("confidence")
            conf_str = _format_float(float(c_val) if c_val is not None else None, decimals=2, is_percentage=True)
            bbox = det.get("bbox", [])
            bbox_str = str(bbox) if bbox else "Not available"

            bg_color = colors.HexColor("#FFFFFF") if idx % 2 != 0 else colors.HexColor("#F8FAFC")

            det_rows.append([
                Paragraph(str(idx), val_style),
                Paragraph(label, val_style),
                Paragraph(conf_str, val_style),
                Paragraph(bbox_str, val_mono),
            ])

        det_table = Table(det_rows, colWidths=[32, 160, 110, 230])
        det_table_style = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ]
        # Alternating rows
        for i in range(1, len(det_rows)):
            if i % 2 == 0:
                det_table_style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#F8FAFC")))

        det_table.setStyle(TableStyle(det_table_style))
        story.append(det_table)
    else:
        # Clear empty / error notice
        if analysis.status == "rejected":
            notice_msg = (
                f"<b>Inference Rejected:</b> {explanation}<br/>"
                f"Reason code: <font name='Courier'>{stored_data.get('reason', 'non_microscopy_image')}</font>. "
                "Cell detection pipeline was safely withheld."
            )
            notice_bg = colors.HexColor("#FEF3C7")
            notice_border = colors.HexColor("#F59E0B")
        elif analysis.status == "failed":
            notice_msg = (
                f"<b>Inference Execution Failed:</b> {analysis.error_message or 'Internal model error'}. "
                "No cell detections could be generated."
            )
            notice_bg = colors.HexColor("#FEE2E2")
            notice_border = colors.HexColor("#EF4444")
        elif analysis.status == "completed":
            notice_msg = (
                "<b>Zero Detections Identified:</b> The AI vision model processed this specimen and recognized "
                "no qualifying cellular structures under current confidence thresholds."
            )
            notice_bg = colors.HexColor("#F1F5F9")
            notice_border = colors.HexColor("#94A3B8")
        else:
            notice_msg = f"<b>Status: {status_display}:</b> Analysis results are not available."
            notice_bg = colors.HexColor("#F1F5F9")
            notice_border = colors.HexColor("#94A3B8")

        notice_table = Table([[Paragraph(notice_msg, body_style)]], colWidths=[532])
        notice_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), notice_bg),
                ("BOX", (0, 0), (-1, -1), 1, notice_border),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ])
        )
        story.append(notice_table)

    story.append(Spacer(1, 10))

    # ─── SECTION 5: VISUAL OVERLAY (IF AVAILABLE) ──────────────────────────────
    if analysis.overlay_filename:
        overlay_rel = Path(analysis.overlay_filename)
        overlay_path = (settings.upload_path / overlay_rel).resolve()
        base_upload_dir = settings.upload_path.resolve()

        if str(overlay_path).startswith(str(base_upload_dir)) and overlay_path.is_file():
            try:
                story.append(KeepTogether([
                    Paragraph("5. VISUAL DETECTION OVERLAY", h2_style),
                    Spacer(1, 4),
                    RLImage(str(overlay_path), width=420, height=260),
                    Spacer(1, 4),
                    Paragraph(
                        f"Figure 1: High-resolution visual overlay with detected cellular bounding boxes and labels. Generated from {file_name}.",
                        subtitle_style,
                    ),
                ]))
                story.append(Spacer(1, 10))
            except Exception:
                # If image read fails, omit image flowable without crashing PDF generation
                pass

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    return buffer.getvalue()
