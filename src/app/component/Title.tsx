'use client';
import META from '@/global/define/metadata';
import { Typography } from '@mui/material';

export default function Title() {
  return (
    <>
      <Typography className="title" variant="h2" component="h1">
        {META.TITLE}
      </Typography>
      <Typography className="title" sx={{ ml: 2 }} variant="body1" gutterBottom>
        {`Version: ${META.VERSION}`}
      </Typography>
      <Typography className="sub-title" variant="h4" component="h2" gutterBottom>
        {'ターン'}
      </Typography>
    </>
  );
}
