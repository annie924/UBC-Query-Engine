"use client"

import {Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis} from "recharts"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card.tsx"

export type chartDataType2 = {
	label: string
	average: number
};


export function InteractiveChart2({
									  barData,
									  instructorName
								  }: {
	barData: chartDataType2[];
	instructorName: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Bar Chart - Instructor's Course Average</CardTitle>
				<CardDescription>All courses taught by {instructorName}</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={400}>
					<BarChart
						data={barData}
						margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="label"
							interval={0} // force showing all labels
							tick={{angle: -45, textAnchor: 'end' }} // rotate to avoid overlap
							height={70} // add vertical space for tilted labels
						/>
						{/*<ChartTooltip*/}
						{/*	cursor={false}*/}
						{/*	content={<ChartTooltipContent hideLabel />}*/}
						{/*/>*/}
						<Tooltip/>
						<Bar dataKey="average" fill="var(--color-desktop)" radius={8}>
							<LabelList
								position="top"
								offset={12}
								className="fill-foreground"
								fontSize={12}
							/>
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	)
}
